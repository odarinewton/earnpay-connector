# EarnPay Connector

Generic TypeScript connector for EarnPay that keeps all provider-specific logic in one place and exposes a simple, reusable API to any app that needs wallet, escrow, FX, payout, and rail capabilities.

This package is intentionally framework-agnostic and app-agnostic. It is not a product-specific SDK and it does not assume a Dignified Hustle job model or local database shape. The connector owns the provider contract; the consuming application only plugs in its own identity mapping and local business logic.

## What this connector exposes

The connector is organized around the same higher-level domains EarnPay provides:

- `identity` — register, authenticate, verify
- `wallet` — create, balance, accounts
- `payments` — create, authorize, capture, cancel, refund
- `escrow` — hold, release, reverse, dispute
- `work` — register, submit, verify, settle
- `earnings` — calculate, allocate, payout
- `fx` — quote, convert
- `payouts` — create, status, destinations
- `agents` — register, authorize, budget, revoke
- `transactions` — get, status, receipt
- `events` — subscribe, webhooks

The public entry point is intentionally small and clean:

```ts
import { EarnPayClient, EarnPayAdapter } from 'earnpay-connector';

const client = new EarnPayClient({
  mode: 'sandbox',
  walletUrl: process.env.EARNPAY_WALLET_URL,
  backendUrl: process.env.EARNPAY_BACKEND_URL,
  serviceApiKey: process.env.EARNPAY_SERVICE_API_KEY,
});

const session = await client.identity.register('+254700000000', '1234');
const balance = await client.wallet.balance(session.sessionToken);
const quote = await client.fx.quote(2500, 'KES');

const adapter = new EarnPayAdapter({
  client,
  platformEscrowSessionToken: process.env.EARNPAY_PLATFORM_ESCROW_SESSION_TOKEN,
  platformEscrowWalletPhone: process.env.EARNPAY_PLATFORM_ESCROW_WALLET_PHONE,
  platformFundsMode: 'platform_wallet',
});

const escrow = await adapter.hold({
  reference: 'job-123',
  amount: 2500,
  toPhone: '+254700000000',
  releaseAfterMs: Date.now() + 60 * 60 * 1000,
});
```

## Install

```bash
npm install
npm run build
```

## Core API

### `EarnPayClient`

Use this when the app needs direct provider access or wants to control a capability step explicitly.

```ts
const session = await client.identity.register('+254700000000', '1234');
const balance = await client.wallet.balance(session.sessionToken);
const fxQuote = await client.fx.quote(1000, 'KES');
const escrow = await client.escrow.hold(session.sessionToken, {
  toPhone: '+254700000000',
  amountMicrosk: 1000000,
  reference: 'order-123',
});
```

### `EarnPayAdapter`

Use this when the app needs a provider-owned, fail-closed escrow adapter with platform wallet safeguards.

```ts
const adapter = new EarnPayAdapter({
  platformEscrowSessionToken: process.env.EARNPAY_PLATFORM_ESCROW_SESSION_TOKEN,
  platformEscrowWalletPhone: process.env.EARNPAY_PLATFORM_ESCROW_WALLET_PHONE,
  platformFundsMode: 'platform_wallet',
});

await adapter.hold({
  reference: 'job-123',
  amount: 2500,
  toPhone: '+254700000000',
});

await adapter.release({
  reference: 'job-123',
  escrowProviderRef: 'EARNPAY-REF-001',
  artisanIdentityId: 'user-456',
  amount: 2500,
  commissionRate: 0.1,
});
```

## Environment variables

```env
EARNPAY_MODE=sandbox
EARNPAY_WALLET_URL=http://localhost:9500
EARNPAY_BACKEND_URL=http://localhost:8003
EARNPAY_SERVICE_API_KEY=...

# Platform-owned funds and escrow config
EARNPAY_PLATFORM_ESCROW_SESSION_TOKEN=...
EARNPAY_PLATFORM_ESCROW_WALLET_PHONE=...
EARNPAY_PLATFORM_FUNDS_MODE=platform_wallet

# Optional network/webhook config
EARNPAY_WEBHOOK_SECRET=...
```

## Design rules

- All provider credentials remain server-only.
- The connector is generic to any app and does not assume local job IDs are the provider reference.
- Wallet identity, settlement destination, and escrow wallet are kept separate.
- The package fails closed when required platform config is missing.
- No consumer app should reimplement SK accounting, FX logic, or payment rails.

## Why this is the right boundary

The consuming app should only adapt provider behavior to its own business model. It should not rebuild EarnPay itself. This connector is the generic boundary; the app integrates through a thin adapter that maps local domain objects to provider calls without duplicating provider logic.
