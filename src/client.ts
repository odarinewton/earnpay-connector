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
import { AgentsClient } from './agents';
import { EarningsClient } from './earnings';
import { EscrowClient } from './escrow';
import { EventsClient } from './events';
import { FxClient } from './fx';
import { IdentityClient } from './identity';
import { PaymentsClient } from './payments';
import { PayoutsClient } from './payouts';
import { TransactionsClient } from './transactions';
import { WalletClient } from './wallet';
import { WorkClient } from './work';

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

export class EarnPayRequestError extends Error {
  readonly status?: number;
  readonly code?: string;
  readonly retryable: boolean;
  readonly raw?: unknown;

  constructor(message: string, details: { status?: number; code?: string; raw?: unknown; retryable?: boolean } = {}) {
    super(message);
    this.name = 'EarnPayRequestError';
    this.status = details.status;
    this.code = details.code;
    this.retryable = details.retryable ?? true;
    this.raw = details.raw;
  }
}

export class EarnPayClient {
  public readonly walletUrl: string;
  public readonly backendUrl: string;
  public readonly mode: EarnPayMode;
  public readonly serviceApiKey?: string;

  public readonly identity: IdentityClient;
  public readonly wallet: WalletClient;
  public readonly payments: PaymentsClient;
  public readonly escrow: EscrowClient;
  public readonly work: WorkClient;
  public readonly earnings: EarningsClient;
  public readonly fx: FxClient;
  public readonly payouts: PayoutsClient;
  public readonly agents: AgentsClient;
  public readonly transactions: TransactionsClient;
  public readonly events: EventsClient;

  constructor(config: EarnPayClientConfig = {}) {
    this.walletUrl = config.walletUrl ?? process.env.EARNPAY_WALLET_URL ?? 'http://localhost:9500';
    this.backendUrl = config.backendUrl ?? process.env.EARNPAY_BACKEND_URL ?? 'http://localhost:8003';
    this.mode = config.mode ?? (process.env.EARNPAY_MODE === 'production' ? 'production' : 'sandbox');
    this.serviceApiKey = config.serviceApiKey ?? process.env.EARNPAY_SERVICE_API_KEY;

    this.identity = new IdentityClient(this);
    this.wallet = new WalletClient(this);
    this.payments = new PaymentsClient(this);
    this.escrow = new EscrowClient(this);
    this.work = new WorkClient(this);
    this.earnings = new EarningsClient(this);
    this.fx = new FxClient(this);
    this.payouts = new PayoutsClient(this);
    this.agents = new AgentsClient(this);
    this.transactions = new TransactionsClient(this);
    this.events = new EventsClient(this);
  }

  async register(phoneE164: string, pin: string): Promise<EarnPaySession> {
    return this.identity.register(phoneE164, pin);
  }

  async login(phoneE164: string, pin: string): Promise<EarnPaySession> {
    return this.identity.authenticate(phoneE164, pin);
  }

  async balance(sessionToken: string): Promise<EarnPayBalance> {
    return this.wallet.balance(sessionToken);
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
      transactionId: this.stringValue(body, ['tx_id', 'transaction_id']),
      raw: body,
    };
  }

  async reverseEscrow(sessionToken: string, transactionId: string, reason: string) {
    return this.request(`${this.walletUrl}/wallet/reverse`, { session_token: sessionToken, tx_id: transactionId, reason });
  }

  async quoteFiatToSk(amountMinor: number, currency = 'KES'): Promise<EarnPayFxQuote> {
    return this.fx.quote(amountMinor, currency);
  }

  async quoteSkToFiat(skUnits: number, targetCurrency = 'KES'): Promise<EarnPayFxQuote> {
    return this.fx.convert(skUnits, targetCurrency);
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
      checkoutRequestId: this.stringValue(body, ['CheckoutRequestID', 'checkout_request_id']),
      merchantRequestId: this.stringValue(body, ['MerchantRequestID', 'merchant_request_id']),
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

  public async walletRequest(path: string, body: Record<string, unknown>): Promise<EarnPaySession> {
    const response = await this.request(`${this.walletUrl}${path}`, body);
    const sessionToken = this.stringValue(response, ['session_token']);
    const identityId = this.stringValue(response, ['identity_id']);

    if (!sessionToken || !identityId) {
      throw new EarnPayUnavailableError('EarnPay returned an incomplete session.');
    }

    return { sessionToken, identityId };
  }

  public async request(
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
        const providerCode = this.stringValue(payload, ['code', 'error_code', 'type']);
        const providerMessage = payload.message ?? payload.error ?? payload.detail ?? `EarnPay request failed (${response.status})`;

        throw new EarnPayRequestError(providerMessage, {
          status: response.status,
          code: providerCode || undefined,
          raw: payload,
          retryable: response.status === 408 || response.status === 429 || response.status >= 500,
        });
      }

      return payload;
    } catch (error) {
      if (!throwOnUnavailable) {
        throw error;
      }

      if (error instanceof EarnPayUnavailableError || error instanceof EarnPayRequestError) {
        throw error;
      }

      throw new EarnPayUnavailableError(error instanceof Error ? error.message : 'EarnPay is temporarily unavailable.');
    }
  }

  public stringValue(value: any, keys: string[]) {
    for (const key of keys) {
      if (typeof value?.[key] === 'string') {
        return value[key] as string;
      }
    }
    return '';
  }

  public numberValue(value: any, keys: string[]) {
    for (const key of keys) {
      if (typeof value?.[key] === 'number') {
        return value[key] as number;
      }
    }
    return undefined;
  }
}

export default EarnPayClient;
