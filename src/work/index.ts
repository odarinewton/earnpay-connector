import type { EarnPayClient } from '../client';
import { ensureObject, ensureSessionToken } from '../validators';

export class WorkClient {
  constructor(private readonly client: EarnPayClient) {}

  async register(sessionToken: string, payload: Record<string, unknown>) {
    const token = ensureSessionToken(sessionToken, 'sessionToken');
    const body = ensureObject(payload, 'payload');
    return this.client.request(`${this.client.walletUrl}/work/register`, { session_token: token, ...body });
  }

  async submit(sessionToken: string, payload: Record<string, unknown>) {
    const token = ensureSessionToken(sessionToken, 'sessionToken');
    const body = ensureObject(payload, 'payload');
    return this.client.request(`${this.client.walletUrl}/work/submit`, { session_token: token, ...body });
  }

  async verify(sessionToken: string, payload: Record<string, unknown>) {
    const token = ensureSessionToken(sessionToken, 'sessionToken');
    const body = ensureObject(payload, 'payload');
    return this.client.request(`${this.client.walletUrl}/work/verify`, { session_token: token, ...body });
  }

  async settle(sessionToken: string, payload: Record<string, unknown>) {
    const token = ensureSessionToken(sessionToken, 'sessionToken');
    const body = ensureObject(payload, 'payload');
    return this.client.request(`${this.client.walletUrl}/work/settle`, { session_token: token, ...body });
  }
}

export default WorkClient;
