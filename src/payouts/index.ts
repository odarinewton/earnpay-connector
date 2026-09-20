import type { EarnPayClient } from '../client';
import { ensureObject, ensureSessionToken, ensureText } from '../validators';

export class PayoutsClient {
  constructor(private readonly client: EarnPayClient) {}

  async create(sessionToken: string, payload: Record<string, unknown>) {
    const token = ensureSessionToken(sessionToken, 'sessionToken');
    const body = ensureObject(payload, 'payload');
    return this.client.request(`${this.client.backendUrl}/payouts/create`, { session_token: token, ...body });
  }

  async status(sessionToken: string, payoutId: string) {
    const token = ensureSessionToken(sessionToken, 'sessionToken');
    const safeId = ensureText(payoutId, 'payoutId');
    return this.client.request(`${this.client.backendUrl}/payouts/status`, { session_token: token, payout_id: safeId });
  }

  async destinations(sessionToken: string) {
    const token = ensureSessionToken(sessionToken, 'sessionToken');
    return this.client.request(`${this.client.backendUrl}/payouts/destinations`, { session_token: token });
  }
}

export default PayoutsClient;
