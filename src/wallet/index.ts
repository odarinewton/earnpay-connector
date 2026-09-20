import type { EarnPayClient } from '../client';
import { ensureSessionToken, normalizePhoneE164 } from '../validators';

export class WalletClient {
  constructor(private readonly client: EarnPayClient) {}

  async create(phoneE164: string, pin: string) {
    return this.client.identity.register(phoneE164, pin);
  }

  async balance(sessionToken: string) {
    const token = ensureSessionToken(sessionToken, 'sessionToken');
    const body = await this.client.request(`${this.client.walletUrl}/wallet/balance?session_token=${encodeURIComponent(token)}`);

    return {
      balanceSk: this.client.numberValue(body, ['balance_sk', 'balance']),
      balanceMicrosk: this.client.numberValue(body, ['balance_microsk', 'sk_units']),
      raw: body,
    };
  }

  async accounts(sessionToken: string) {
    const token = ensureSessionToken(sessionToken, 'sessionToken');
    return this.client.request(`${this.client.walletUrl}/wallet/accounts`, {
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
