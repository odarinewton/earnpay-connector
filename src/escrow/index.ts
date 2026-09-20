import type { EarnPayClient } from '../client';
import { ensurePositiveInteger, ensureSessionToken, normalizeReference, normalizePhoneE164 } from '../validators';

export class EscrowClient {
  constructor(private readonly client: EarnPayClient) {}

  async hold(sessionToken: string, input: { toPhone: string; amountMicrosk: number; reference: string; releaseAfter?: number }) {
    const token = ensureSessionToken(sessionToken, 'sessionToken');
    const toPhone = normalizePhoneE164(input.toPhone, 'toPhone');
    const amount = ensurePositiveInteger(input.amountMicrosk, 'amountMicrosk');
    const reference = normalizeReference(input.reference, 'reference');

    return this.client.createEscrow(token, {
      toPhone: toPhone,
      amountMicrosk: amount,
      reference,
      releaseAfter: input.releaseAfter,
    });
  }

  async release(sessionToken: string, transactionId: string, reason?: string) {
    const token = ensureSessionToken(sessionToken, 'sessionToken');
    const txId = ensureSessionToken(transactionId, 'transactionId');

    return this.client.request(`${this.client.walletUrl}/wallet/release`, {
      session_token: token,
      tx_id: txId,
      reason: reason ?? 'release',
    });
  }

  async reverse(sessionToken: string, transactionId: string, reason?: string) {
    const token = ensureSessionToken(sessionToken, 'sessionToken');
    const txId = ensureSessionToken(transactionId, 'transactionId');
    return this.client.reverseEscrow(token, txId, reason ?? 'reversal');
  }

  async dispute(sessionToken: string, transactionId: string, reason: string) {
    const token = ensureSessionToken(sessionToken, 'sessionToken');
    const txId = ensureSessionToken(transactionId, 'transactionId');
    const safeReason = ensureSessionToken(reason, 'reason');

    return this.client.request(`${this.client.walletUrl}/wallet/dispute`, {
      session_token: token,
      tx_id: txId,
      reason: safeReason,
    });
  }
}

export default EscrowClient;
