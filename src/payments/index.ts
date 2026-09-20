import type { EarnPayClient } from '../client';
import { ensurePositiveInteger, ensureSessionToken, normalizeReference, normalizePhoneE164 } from '../validators';

export class PaymentsClient {
  constructor(private readonly client: EarnPayClient) {}

  async create(sessionToken: string, input: { toPhone: string; amountMicrosk: number; reference: string; releaseAfter?: number }) {
    const token = ensureSessionToken(sessionToken, 'sessionToken');
    const safeReference = normalizeReference(input.reference, 'reference');
    const amount = ensurePositiveInteger(input.amountMicrosk, 'amountMicrosk');
    const toPhone = normalizePhoneE164(input.toPhone, 'toPhone');

    return this.client.createEscrow(token, {
      toPhone: toPhone,
      amountMicrosk: amount,
      reference: safeReference,
      releaseAfter: input.releaseAfter,
    });
  }

  async authorize(sessionToken: string, input: { amountMicrosk: number; reference: string; toPhone?: string }) {
    const token = ensureSessionToken(sessionToken, 'sessionToken');
    const safeReference = normalizeReference(input.reference, 'reference');
    const amount = ensurePositiveInteger(input.amountMicrosk, 'amountMicrosk');
    const toPhone = input.toPhone ? normalizePhoneE164(input.toPhone, 'toPhone') : undefined;

    return this.client.createEscrow(token, {
      toPhone: toPhone ?? '+254700000000',
      amountMicrosk: amount,
      reference: safeReference,
    });
  }

  async capture(sessionToken: string, txId: string) {
    const token = ensureSessionToken(sessionToken, 'sessionToken');
    const transactionId = ensureSessionToken(txId, 'txId');
    return this.client.request(`${this.client.walletUrl}/payments/capture`, {
      session_token: token,
      tx_id: transactionId,
    });
  }

  async cancel(sessionToken: string, txId: string) {
    const token = ensureSessionToken(sessionToken, 'sessionToken');
    const transactionId = ensureSessionToken(txId, 'txId');
    return this.client.request(`${this.client.walletUrl}/payments/cancel`, {
      session_token: token,
      tx_id: transactionId,
    });
  }

  async refund(sessionToken: string, txId: string, reason?: string) {
    const token = ensureSessionToken(sessionToken, 'sessionToken');
    const transactionId = ensureSessionToken(txId, 'txId');
    return this.client.reverseEscrow(token, transactionId, reason ?? 'customer_refund');
  }
}

export default PaymentsClient;
