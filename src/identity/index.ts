import type { EarnPayClient } from '../client';
import { ensureSessionToken, normalizePhoneE164 } from '../validators';

export class IdentityClient {
  constructor(private readonly client: EarnPayClient) {}

  async register(phoneE164: string, pin: string) {
    const phone = normalizePhoneE164(phoneE164, 'phoneE164');
    const safePin = ensureSessionToken(pin, 'pin');

    try {
      return await this.client.walletRequest('/wallet/register', {
        phone_e164: phone,
        pin: safePin,
      });
    } catch (error) {
      if (!isAlreadyRegisteredError(error)) {
        throw error;
      }

      return this.authenticate(phone, safePin);
    }
  }

  async authenticate(phoneE164: string, pin: string) {
    const phone = normalizePhoneE164(phoneE164, 'phoneE164');
    const safePin = ensureSessionToken(pin, 'pin');

    return this.client.walletRequest('/wallet/login', {
      phone_e164: phone,
      pin: safePin,
    });
  }

  async verify(sessionToken: string) {
    return this.client.request(`${this.client.walletUrl}/wallet/verify`, {
      session_token: ensureSessionToken(sessionToken, 'sessionToken'),
    });
  }
}

function isAlreadyRegisteredError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error ?? '').toLowerCase();

  if (!message) {
    return false;
  }

  return [
    'already exists',
    'already registered',
    'duplicate user',
    'user already exists',
    'already in use',
    'conflict',
    'duplicate',
    '409',
  ].some((token) => message.includes(token));
}

export default IdentityClient;
