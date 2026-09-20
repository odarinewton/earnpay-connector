export type { EarnPayBalance, EarnPayEscrow, EarnPayFxQuote, EarnPayMode, EarnPayResult, EarnPaySession, EarnPayStkPush } from './types';

import type {
  EarnPayBalance,
  EarnPayEscrow,
  EarnPayFxQuote,
  EarnPayMode,
  EarnPayResult,
  EarnPaySession,
  EarnPayStkPush,
} from './types';

export interface EarnPayClientConfig {
  walletUrl?: string;
  backendUrl?: string;
  mode?: EarnPayMode;
  serviceApiKey?: string;
}

export class EarnPayUnavailableError extends Error {
  readonly retryable = true;

  constructor(message: string) {
    super(message);
    this.name = 'EarnPayUnavailableError';
  }
}

export class EarnPayClient {
  private readonly walletUrl: string;
  private readonly backendUrl: string;
  private readonly mode: EarnPayMode;
  private readonly serviceApiKey?: string;

  constructor(config: EarnPayClientConfig = {}) {
    this.walletUrl = config.walletUrl ?? process.env.EARNPAY_WALLET_URL ?? 'http://localhost:9500';
    this.backendUrl = config.backendUrl ?? process.env.EARNPAY_BACKEND_URL ?? 'http://localhost:8003';
    this.mode = config.mode ?? (process.env.EARNPAY_MODE === 'production' ? 'production' : 'sandbox');
    this.serviceApiKey = config.serviceApiKey ?? process.env.EARNPAY_SERVICE_API_KEY;
  }

  async register(phoneE164: string, pin: string): Promise<EarnPaySession> {
    return this.wallet('/wallet/register', { phone_e164: phoneE164, pin });
  }

  async login(phoneE164: string, pin: string): Promise<EarnPaySession> {
    return this.wallet('/wallet/login', { phone_e164: phoneE164, pin });
  }

  async balance(sessionToken: string): Promise<EarnPayBalance> {
    const body = await this.request(`${this.walletUrl}/wallet/balance?session_token=${encodeURIComponent(sessionToken)}`);
    return {
      balanceSk: numberValue(body, ['balance_sk', 'balance']),
      balanceMicrosk: numberValue(body, ['balance_microsk', 'sk_units']),
      raw: body,
    };
  }

  async createEscrow(sessionToken: string, input: { toPhone: string; amountMicrosk: number; releaseAfter?: number; reference: string }): Promise<EarnPayEscrow> {
    const body = await this.request(`${this.walletUrl}/wallet/escrow`, {
      session_token: sessionToken,
      to_phone: input.toPhone,
      amount: input.amountMicrosk,
      currency: 'SK',
      condition_type: 'time_lock',
      release_after: input.releaseAfter ?? Date.now() + 72 * 60 * 60 * 1000,
      reference: input.reference,
    });

    return {
      transactionId: stringValue(body, ['tx_id', 'transaction_id']),
      raw: body,
    };
  }

  async reverseEscrow(sessionToken: string, transactionId: string, reason: string) {
    return this.request(`${this.walletUrl}/wallet/reverse`, { session_token: sessionToken, tx_id: transactionId, reason });
  }

  async quoteFiatToSk(amountMinor: number, currency = 'KES'): Promise<EarnPayFxQuote> {
    const body = await this.request(`${this.backendUrl}/fx/quote/deposit`, { amount: amountMinor, currency });
    return {
      skUnits: numberValue(body, ['sk_units', 'sk_credited']),
      rateUsed: numberValue(body, ['rate_used', 'rate']),
      raw: body,
    };
  }

  async quoteSkToFiat(skUnits: number, targetCurrency = 'KES'): Promise<EarnPayFxQuote> {
    const body = await this.request(`${this.backendUrl}/fx/quote/withdraw`, { sk_units: skUnits, target_currency: targetCurrency });
    return {
      fiatAmount: numberValue(body, ['fiat_amount', 'fiat_to_disburse']),
      rateUsed: numberValue(body, ['rate_used', 'rate']),
      raw: body,
    };
  }

  async peg() {
    return this.request(`${this.backendUrl}/fx/peg`);
  }

  async disburseEscrow(input: { escrowTxRef: string; artisanIdentityId: string; amountSk: number }): Promise<unknown> {
    if (!this.serviceApiKey) {
      throw new EarnPayUnavailableError('EarnPay service disbursement is not configured.');
    }

    return this.request(
      `${this.backendUrl}/backend/escrow-disburse`,
      {
        escrow_tx_ref: input.escrowTxRef,
        disbursements: [{ identity_id: input.artisanIdentityId, amount_sk: input.amountSk }],
      },
      { 'X-Service-Key': this.serviceApiKey },
    );
  }

  async mpesaStkPush(sessionToken: string, input: { phone: string; amountKes: number; reference: string; description: string }): Promise<EarnPayStkPush> {
    const body = await this.request(`${this.backendUrl}/rail/mpesa/stk_push`, {
      session_token: sessionToken,
      phone: input.phone,
      amount_kes: input.amountKes,
      reference: input.reference,
      description: input.description,
    });

    return {
      checkoutRequestId: stringValue(body, ['CheckoutRequestID', 'checkout_request_id']),
      merchantRequestId: stringValue(body, ['MerchantRequestID', 'merchant_request_id']),
      raw: body,
    };
  }

  async mpesaStkStatus(sessionToken: string, checkoutRequestId: string) {
    return this.request(`${this.backendUrl}/rail/mpesa/stk_push_status`, {
      session_token: sessionToken,
      checkout_request_id: checkoutRequestId,
    });
  }

  async health(): Promise<EarnPayResult<unknown>> {
    try {
      return { ok: true, data: await this.request(`${this.backendUrl}/health`, undefined, undefined, false) };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'EarnPay is unavailable.',
        retryable: true,
      };
    }
  }

  get platformMode() {
    return this.mode;
  }

  private async wallet(path: string, body: Record<string, unknown>): Promise<EarnPaySession> {
    const response = await this.request(`${this.walletUrl}${path}`, body);
    const sessionToken = stringValue(response, ['session_token']);
    const identityId = stringValue(response, ['identity_id']);

    if (!sessionToken || !identityId) {
      throw new EarnPayUnavailableError('EarnPay returned an incomplete session.');
    }

    return { sessionToken, identityId };
  }

  private async request(
    url: string,
    body?: Record<string, unknown>,
    extraHeaders?: Record<string, string>,
    throwOnUnavailable = true,
  ): Promise<any> {
    try {
      const response = await fetch(url, {
        method: body ? 'POST' : 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(extraHeaders ?? {}),
        },
        body: body ? JSON.stringify(body) : undefined,
        cache: 'no-store',
      });

      const text = await response.text();
      let payload: any = {};

      try {
        payload = text ? JSON.parse(text) : {};
      } catch {
        payload = { raw: text };
      }

      if (!response.ok) {
        throw new Error(payload.message ?? payload.error ?? `EarnPay request failed (${response.status})`);
      }

      return payload;
    } catch (error) {
      if (!throwOnUnavailable) {
        throw error;
      }

      if (error instanceof EarnPayUnavailableError) {
        throw error;
      }

      throw new EarnPayUnavailableError(error instanceof Error ? error.message : 'EarnPay is temporarily unavailable.');
    }
  }
}

function stringValue(value: any, keys: string[]) {
  for (const key of keys) {
    if (typeof value?.[key] === 'string') {
      return value[key] as string;
    }
  }
  return '';
}

function numberValue(value: any, keys: string[]) {
  for (const key of keys) {
    if (typeof value?.[key] === 'number') {
      return value[key] as number;
    }
  }
  return undefined;
}
