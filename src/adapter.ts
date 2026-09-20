import { EarnPayClient, EarnPayUnavailableError } from './client';
import type { EscrowAdapter, EscrowAdapterResult, HoldEscrowInput, RefundEscrowInput, ReleaseEscrowInput } from './types';

export interface EarnPayAdapterConfig {
  client?: EarnPayClient;
  platformEscrowSessionToken?: string;
  platformEscrowWalletPhone?: string;
  platformFundsMode?: 'platform_wallet' | 'manual' | string;
  quoteCurrency?: string;
}

export class EarnPayAdapter implements EscrowAdapter {
  private readonly client: EarnPayClient;
  private readonly platformEscrowSessionToken?: string;
  private readonly platformEscrowWalletPhone?: string;
  private readonly platformFundsMode: string;
  private readonly quoteCurrency: string;

  constructor(config: EarnPayAdapterConfig = {}) {
    this.client = config.client ?? new EarnPayClient();
    this.platformEscrowSessionToken =
      config.platformEscrowSessionToken ??
      process.env.EARNPAY_PLATFORM_ESCROW_SESSION_TOKEN ??
      process.env.EARNPAY_ESCROW_SESSION_TOKEN;
    this.platformEscrowWalletPhone =
      config.platformEscrowWalletPhone ??
      process.env.EARNPAY_PLATFORM_ESCROW_WALLET_PHONE ??
      process.env.EARNPAY_ESCROW_RECIPIENT_PHONE;
    this.platformFundsMode =
      config.platformFundsMode ??
      process.env.EARNPAY_PLATFORM_FUNDS_MODE ??
      process.env.EARNPAY_CLIENT_FUNDS_MODE ??
      'platform_wallet';
    this.quoteCurrency = config.quoteCurrency ?? 'KES';
  }

  async hold(input: HoldEscrowInput): Promise<EscrowAdapterResult> {
    if (this.platformFundsMode !== 'platform_wallet') {
      throw new EarnPayUnavailableError(
        'EarnPay platform wallet funding is not enabled yet. Configure the platform wallet before enabling real escrow.',
      );
    }

    if (!this.platformEscrowSessionToken || !this.platformEscrowWalletPhone) {
      throw new EarnPayUnavailableError('EarnPay platform escrow wallet is not configured yet.');
    }

    const quote = await this.client.quoteFiatToSk(Math.round(input.amount * 100), this.quoteCurrency);
    if (!quote.skUnits) {
      throw new EarnPayUnavailableError('EarnPay did not return an SK quote for this escrow.');
    }

    const escrow = await this.client.createEscrow(this.platformEscrowSessionToken, {
      reference: input.reference,
      toPhone: input.toPhone ?? this.platformEscrowWalletPhone,
      amountMicrosk: quote.skUnits,
      releaseAfter: input.releaseAfterMs,
    });

    return { providerRef: escrow.transactionId, raw: escrow.raw };
  }

  async release(input: ReleaseEscrowInput): Promise<EscrowAdapterResult> {
    if (!input.artisanIdentityId) {
      throw new EarnPayUnavailableError('This artisan is not linked to an EarnPay identity yet. Payout paused safely.');
    }

    const commissionAmount = Math.round(input.amount * input.commissionRate);
    const artisanPayout = input.amount - commissionAmount;
    const quote = await this.client.quoteFiatToSk(Math.round(artisanPayout * 100), this.quoteCurrency);

    if (!quote.skUnits) {
      throw new EarnPayUnavailableError('EarnPay did not return an SK payout quote.');
    }

    const result = await this.client.disburseEscrow({
      escrowTxRef: input.escrowProviderRef,
      artisanIdentityId: input.artisanIdentityId,
      amountSk: quote.skUnits / 1_000_000,
    });

    return {
      providerRef: `EARNPAY-${input.reference}`,
      commissionAmount,
      artisanPayout,
      raw: result,
    };
  }

  async refund(input: RefundEscrowInput): Promise<EscrowAdapterResult> {
    if (!this.platformEscrowSessionToken) {
      throw new EarnPayUnavailableError('EarnPay refund configuration is not set up yet.');
    }

    const result = await this.client.reverseEscrow(
      this.platformEscrowSessionToken,
      input.escrowProviderRef,
      input.reason ?? `Refund for ${input.reference}`,
    );

    return {
      providerRef: String(result?.tx_id ?? input.escrowProviderRef),
      raw: result,
    };
  }
}

export default EarnPayAdapter;
