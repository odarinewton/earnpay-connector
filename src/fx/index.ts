import type { EarnPayClient } from '../client';
import { ensurePositiveInteger, ensureText } from '../validators';

export class FxClient {
  constructor(private readonly client: EarnPayClient) {}

  async quote(amountMinor: number, currency = 'KES') {
    const amount = ensurePositiveInteger(amountMinor, 'amountMinor');
    const safeCurrency = ensureText(currency, 'currency').toUpperCase();
    const body = await this.client.request(`${this.client.backendUrl}/fx/quote/deposit`, { amount, currency: safeCurrency });
    return {
      skUnits: this.client.numberValue(body, ['sk_units', 'sk_credited']),
      rateUsed: this.client.numberValue(body, ['rate_used', 'rate']),
      raw: body,
    };
  }

  async convert(skUnits: number, targetCurrency = 'KES') {
    const amount = ensurePositiveInteger(skUnits, 'skUnits');
    const safeTargetCurrency = ensureText(targetCurrency, 'targetCurrency').toUpperCase();
    const body = await this.client.request(`${this.client.backendUrl}/fx/quote/withdraw`, {
      sk_units: amount,
      target_currency: safeTargetCurrency,
    });

    return {
      fiatAmount: this.client.numberValue(body, ['fiat_amount', 'fiat_to_disburse']),
      rateUsed: this.client.numberValue(body, ['rate_used', 'rate']),
      raw: body,
    };
  }
}

export default FxClient;
