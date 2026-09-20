import type { EarnPayClient } from '../client';
import { ensureSessionToken, ensureText } from '../validators';

export class TransactionsClient {
  constructor(private readonly client: EarnPayClient) {}

  async get(sessionToken: string, transactionId: string) {
    const token = ensureSessionToken(sessionToken, 'sessionToken');
    const txId = ensureText(transactionId, 'transactionId');
    return this.client.request(`${this.client.backendUrl}/transactions/get`, { session_token: token, tx_id: txId });
  }

  async status(sessionToken: string, transactionId: string) {
    const token = ensureSessionToken(sessionToken, 'sessionToken');
    const txId = ensureText(transactionId, 'transactionId');
    return this.client.request(`${this.client.backendUrl}/transactions/status`, { session_token: token, tx_id: txId });
  }

  async receipt(sessionToken: string, transactionId: string) {
    const token = ensureSessionToken(sessionToken, 'sessionToken');
    const txId = ensureText(transactionId, 'transactionId');
    return this.client.request(`${this.client.backendUrl}/transactions/receipt`, { session_token: token, tx_id: txId });
  }
}

export default TransactionsClient;
