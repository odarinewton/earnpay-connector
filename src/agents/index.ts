import type { EarnPayClient } from '../client';
import { ensureObject, ensurePositiveInteger, ensureSessionToken, ensureText } from '../validators';

export class AgentsClient {
  constructor(private readonly client: EarnPayClient) {}

  async account(sessionToken: string, accountId?: string) {
    const token = ensureSessionToken(sessionToken, 'sessionToken');
    const body: Record<string, unknown> = { session_token: token };

    if (accountId) {
      body.account_id = ensureText(accountId, 'accountId');
    }

    return this.client.request(`${this.client.backendUrl}/agents/account`, body);
  }

  async balance(sessionToken: string, accountId?: string) {
    const token = ensureSessionToken(sessionToken, 'sessionToken');
    const body: Record<string, unknown> = { session_token: token };

    if (accountId) {
      body.account_id = ensureText(accountId, 'accountId');
    }

    return this.client.request(`${this.client.backendUrl}/agents/balance`, body);
  }

  async fund(
    sessionToken: string,
    input: { amountMicrosk: number; reference: string; source?: string; accountId?: string; currency?: string; idempotencyKey?: string },
  ) {
    const token = ensureSessionToken(sessionToken, 'sessionToken');
    const amount = ensurePositiveInteger(input.amountMicrosk, 'amountMicrosk');
    const body: Record<string, unknown> = {
      session_token: token,
      amount_microsk: amount,
      reference: ensureText(input.reference, 'reference'),
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

    return this.client.request(`${this.client.backendUrl}/agents/fund`, body);
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

    return this.client.request(`${this.client.backendUrl}/agents/history`, body);
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

    return this.client.request(`${this.client.backendUrl}/agents/confirmations`, body);
  }

  async register(sessionToken: string, payload: Record<string, unknown>) {
    const token = ensureSessionToken(sessionToken, 'sessionToken');
    const body = ensureObject(payload, 'payload');
    return this.client.request(`${this.client.backendUrl}/agents/register`, { session_token: token, ...body });
  }

  async authorize(sessionToken: string, payload: Record<string, unknown>) {
    const token = ensureSessionToken(sessionToken, 'sessionToken');
    const body = ensureObject(payload, 'payload');
    return this.client.request(`${this.client.backendUrl}/agents/authorize`, { session_token: token, ...body });
  }

  async budget(sessionToken: string, payload: Record<string, unknown>) {
    const token = ensureSessionToken(sessionToken, 'sessionToken');
    const body = ensureObject(payload, 'payload');
    return this.client.request(`${this.client.backendUrl}/agents/budget`, { session_token: token, ...body });
  }

  async revoke(sessionToken: string, payload: Record<string, unknown>) {
    const token = ensureSessionToken(sessionToken, 'sessionToken');
    const body = ensureObject(payload, 'payload');
    return this.client.request(`${this.client.backendUrl}/agents/revoke`, { session_token: token, ...body });
  }
}

export default AgentsClient;
