# EarnPay Connector

Generic TypeScript adapter for integrating with the EarnPay wallet, escrow, FX, and payout APIs.

This package is intentionally framework-agnostic. It exposes a thin client and an escrow adapter that can be dropped into a server-side application without coupling to a specific app or database layer.

## Features

- Wallet registration and login
- Balance lookup
- FX quote support for fiat-to-SK and SK-to-fiat flows
- Escrow hold and reverse/refund endpoints
- Disbursement helpers for provider-backed payouts
- MPESA STK push helper methods
- Safe fail-closed behavior for incomplete provider configuration

## Install

```bash
npm install
npm run build
```

## Quick example

```ts
import { EarnPayClient, EarnPayAdapter } from './src';

const client = new EarnPayClient({
  walletUrl: process.env.EARNPAY_WALLET_URL ?? 'http://localhost:9500',
  backendUrl: process.env.EARNPAY_BACKEND_URL ?? 'http://localhost:8003',
  mode: 'sandbox',
  serviceApiKey: process.env.EARNPAY_SERVICE_API_KEY,
});

const session = await client.register('+254700000000', '1234');
const balance = await client.balance(session.sessionToken);

const adapter = new EarnPayAdapter({
  platformEscrowSessionToken: process.env.EARNPAY_PLATFORM_ESCROW_SESSION_TOKEN,
  platformEscrowWalletPhone: process.env.EARNPAY_PLATFORM_ESCROW_WALLET_PHONE,
  platformFundsMode: 'platform_wallet',
  client,
});

const escrow = await adapter.hold({
  reference: 'job-123',
  amount: 2500,
  toPhone: '+254700000000',
});
```

## Environment variables

```env
EARNPAY_MODE=sandbox
EARNPAY_WALLET_URL=http://localhost:9500
EARNPAY_BACKEND_URL=http://localhost:8003
EARNPAY_SERVICE_API_KEY=...
EARNPAY_PLATFORM_ESCROW_SESSION_TOKEN=...
EARNPAY_PLATFORM_ESCROW_WALLET_PHONE=...
EARNPAY_PLATFORM_FUNDS_MODE=platform_wallet
```

## Notes

- Keep all provider credentials on the server side only.
- Treat the wallet identifier / phone as a provider identity, not the permanent funds destination.
- Keep wallet identity, payout destination, and platform escrow config separate in production.
