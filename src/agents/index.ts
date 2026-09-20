import type { EarnPayClient } from '../client';
import { ensureObject, ensureSessionToken } from '../validators';

export class AgentsClient {
  constructor(private readonly client: EarnPayClient) {}

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
