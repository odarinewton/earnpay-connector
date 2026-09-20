import type { EarnPayClient } from '../client';
import { ensurePositiveInteger, ensureSessionToken, ensureText, normalizePhoneE164 } from '../validators';

export class WalletClient {
  constructor(private readonly client: EarnPayClient) {}

  async create(phoneE164: string, pin: string) {
    return this.client.identity.register(phoneE164, pin);
  }

  async account(sessionToken: string, accountId?: string) {
    const token = ensureSessionToken(sessionToken, 'sessionToken');
    const body: Record<string, unknown> = { session_token: token };

    if (accountId) {
      body.account_id = ensureText(accountId, 'accountId');
    }

    return this.client.request(`${this.client.backendUrl}/wallet/account`, body);
  }

  async balance(sessionToken: string, accountId?: string) {
    const token = ensureSessionToken(sessionToken, 'sessionToken');
    const body: Record<string, unknown> = { session_token: token };

    if (accountId) {
      body.account_id = ensureText(accountId, 'accountId');
    }

    const response = await this.client.request(`${this.client.backendUrl}/wallet/balance`, body);

    return {
      balanceSk: this.client.numberValue(response, ['balance_sk', 'ask_balance', 'balance']),
      balanceMicrosk: this.client.numberValue(response, ['balance_microsk', 'sk_units', 'micro_sk']),
      raw: response,
    };
  }

  async fund(
    sessionToken: string,
    input: { amountMicrosk: number; reference: string; source?: string; accountId?: string; currency?: string; idempotencyKey?: string },
  ) {
    const token = ensureSessionToken(sessionToken, 'sessionToken');
    const amount = ensurePositiveInteger(input.amountMicrosk, 'amountMicrosk');
    const reference = ensureText(input.reference, 'reference');
    const body: Record<string, unknown> = {
      session_token: token,
      amount_microsk: amount,
      reference,
    };

    if (input.accountId) {
      body.account_id = ensureText(input.accountId, 'accountId');
    }
    if (input.source) {
      body.source = ensureText(input.source, 'source');
    }
    if (input.currency) {
      body.currency = ensureText(input.currency, 'currency');
    }
    if (input.idempotencyKey) {
      body.idempotency_key = ensureText(input.idempotencyKey, 'idempotencyKey');
    }

    return this.client.request(`${this.client.backendUrl}/wallet/fund`, body);
  }

  async confirmations(
    sessionToken: string,
    input: { accountId?: string; txId?: string; limit?: number } = {},
  ) {
    const token = ensureSessionToken(sessionToken, 'sessionToken');
    const body: Record<string, unknown> = { session_token: token };

    if (input.accountId) {
      body.account_id = ensureText(input.accountId, 'accountId');
    }
    if (input.txId) {
      body.tx_id = ensureText(input.txId, 'txId');
    }
    if (typeof input.limit !== 'undefined') {
      body.limit = ensurePositiveInteger(input.limit, 'limit');
    }

    return this.client.request(`${this.client.backendUrl}/wallet/confirmations`, body);
  }

  async history(
    sessionToken: string,
    input: { accountId?: string; txId?: string; limit?: number; since?: number; cursor?: string } = {},
  ) {
    const token = ensureSessionToken(sessionToken, 'sessionToken');
    const body: Record<string, unknown> = { session_token: token };

    if (input.accountId) {
      body.account_id = ensureText(input.accountId, 'accountId');
    }
    if (input.txId) {
      body.tx_id = ensureText(input.txId, 'txId');
    }
    if (typeof input.limit !== 'undefined') {
      body.limit = ensurePositiveInteger(input.limit, 'limit');
    }
    if (typeof input.since !== 'undefined') {
      body.since = ensurePositiveInteger(input.since, 'since');
    }
    if (input.cursor) {
      body.cursor = ensureText(input.cursor, 'cursor');
    }

    return this.client.request(`${this.client.backendUrl}/wallet/history`, body);
  }

  async accounts(sessionToken: string) {
    const token = ensureSessionToken(sessionToken, 'sessionToken');
    return this.client.request(`${this.client.backendUrl}/wallet/accounts`, {
      session_token: token,
    });
  }

  async register(phoneE164: string, pin: string) {
    const phone = normalizePhoneE164(phoneE164, 'phoneE164');
    return this.client.walletRequest('/wallet/register', {
      phone_e164: phone,
      pin: ensureSessionToken(pin, 'pin'),
    });
  }

  async login(phoneE164: string, pin: string) {
    const phone = normalizePhoneE164(phoneE164, 'phoneE164');
    return this.client.walletRequest('/wallet/login', {
      phone_e164: phone,
      pin: ensureSessionToken(pin, 'pin'),
    });
  }
}

export default WalletClient;
