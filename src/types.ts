export type EarnPayMode = 'sandbox' | 'production';

export interface EarnPaySession {
  sessionToken: string;
  identityId: string;
}

export interface EarnPayResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
  retryable?: boolean;
}

export interface EarnPayBalance {
  balanceSk?: number;
  balanceMicrosk?: number;
  raw: unknown;
}

export interface EarnPayEscrow {
  transactionId: string;
  raw: unknown;
}

export interface EarnPayStkPush {
  checkoutRequestId?: string;
  merchantRequestId?: string;
  raw: unknown;
}

export interface EarnPayFxQuote {
  skUnits?: number;
  fiatAmount?: number;
  rateUsed?: number;
  raw: unknown;
}

export interface HoldEscrowInput {
  reference: string;
  amount: number;
  toPhone?: string;
  releaseAfterMs?: number;
}

export interface ReleaseEscrowInput {
  reference: string;
  escrowProviderRef: string;
  artisanIdentityId: string;
  amount: number;
  commissionRate: number;
}

export interface RefundEscrowInput {
  reference: string;
  escrowProviderRef: string;
  reason?: string;
}

export interface EscrowAdapterResult {
  providerRef: string;
  commissionAmount?: number;
  artisanPayout?: number;
  raw?: unknown;
}

export interface EscrowAdapter {
  hold(input: HoldEscrowInput): Promise<EscrowAdapterResult>;
  release(input: ReleaseEscrowInput): Promise<EscrowAdapterResult>;
  refund(input: RefundEscrowInput): Promise<EscrowAdapterResult>;
}
