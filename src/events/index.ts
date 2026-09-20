import type { EarnPayClient } from '../client';
import { ensureObject, ensureSessionToken, ensureText } from '../validators';

export class EventsClient {
  constructor(private readonly client: EarnPayClient) {}

  async subscribe(sessionToken: string, channel: string) {
    const token = ensureSessionToken(sessionToken, 'sessionToken');
    const safeChannel = ensureText(channel, 'channel');
    return this.client.request(`${this.client.backendUrl}/events/subscribe`, {
      session_token: token,
      channel: safeChannel,
    });
  }

  async webhooks(signature: string, payload: Record<string, unknown>) {
    const safeSignature = ensureText(signature, 'signature');
    const safePayload = ensureObject(payload, 'payload');
    return this.client.request(`${this.client.backendUrl}/events/webhooks`, {
      signature: safeSignature,
      payload: safePayload,
    }, {
      'X-EarnPay-Signature': safeSignature,
    });
  }
}

export default EventsClient;
