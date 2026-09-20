import type { EarnPayClient } from '../client';
import { ensureObject, ensureSessionToken } from '../validators';

export class EarningsClient {
  constructor(private readonly client: EarnPayClient) {}

  async calculate(sessionToken: string, payload: Record<string, unknown>) {
    const token = ensureSessionToken(sessionToken, 'sessionToken');
    const body = ensureObject(payload, 'payload');
    return this.client.request(`${this.client.backendUrl}/earnings/calculate`, { session_token: token, ...body });
  }

  async allocate(sessionToken: string, payload: Record<string, unknown>) {
    const token = ensureSessionToken(sessionToken, 'sessionToken');
    const body = ensureObject(payload, 'payload');
    return this.client.request(`${this.client.backendUrl}/earnings/allocate`, { session_token: token, ...body });
  }

  async payout(sessionToken: string, payload: Record<string, unknown>) {
    const token = ensureSessionToken(sessionToken, 'sessionToken');
    const body = ensureObject(payload, 'payload');
    return this.client.request(`${this.client.backendUrl}/earnings/payout`, { session_token: token, ...body });
  }
}

export default EarningsClient;
