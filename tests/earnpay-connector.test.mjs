import test from 'node:test';
import assert from 'node:assert/strict';
import { EarnPayClient } from '../dist/index.js';

test('wallet exposes funding, confirmations and history through the EarnPay connector', async () => {
  const client = new EarnPayClient({
    walletUrl: 'https://wallet.example',
    backendUrl: 'https://backend.example',
  });

  const calls = [];
  client.request = async (url, body) => {
    calls.push({ url, body });
    return { ok: true };
  };

  await client.wallet.fund('session-token', {
    amountMicrosk: 2500,
    reference: 'fund-001',
    source: 'platform',
  });

  await client.wallet.confirmations('session-token', { accountId: 'acct-9' });
  await client.wallet.history('session-token', { limit: 25 });

  assert.deepStrictEqual(calls[0], {
    url: 'https://backend.example/wallet/fund',
    body: {
      session_token: 'session-token',
      amount_microsk: 2500,
      reference: 'fund-001',
      source: 'platform',
    },
  });

  assert.deepStrictEqual(calls[1], {
    url: 'https://backend.example/wallet/confirmations',
    body: {
      session_token: 'session-token',
      account_id: 'acct-9',
    },
  });

  assert.deepStrictEqual(calls[2], {
    url: 'https://backend.example/wallet/history',
    body: {
      session_token: 'session-token',
      limit: 25,
    },
  });
});

test('agents expose account management, balance, funding, history and confirmations through the connector', async () => {
  const client = new EarnPayClient({
    walletUrl: 'https://wallet.example',
    backendUrl: 'https://backend.example',
  });

  const calls = [];
  client.request = async (url, body) => {
    calls.push({ url, body });
    return { ok: true };
  };

  await client.agents.account('session-token', 'agent-42');
  await client.agents.balance('session-token', 'agent-42');
  await client.agents.fund('session-token', { amountMicrosk: 9000, reference: 'agent-fund-1' });
  await client.agents.history('session-token', { accountId: 'agent-42', limit: 10 });
  await client.agents.confirmations('session-token', { accountId: 'agent-42' });

  assert.equal(calls[0].url, 'https://backend.example/agents/account');
  assert.equal(calls[1].url, 'https://backend.example/agents/balance');
  assert.equal(calls[2].url, 'https://backend.example/agents/fund');
  assert.equal(calls[3].url, 'https://backend.example/agents/history');
  assert.equal(calls[4].url, 'https://backend.example/agents/confirmations');
});

test('provider failures include structured status metadata and retryability', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: false,
    status: 429,
    text: async () => JSON.stringify({ message: 'too many requests', code: 'RATE_LIMITED' }),
  });

  try {
    const client = new EarnPayClient({
      walletUrl: 'https://wallet.example',
      backendUrl: 'https://backend.example',
    });

    await assert.rejects(
      () => client.request('https://backend.example/health'),
      (error) => {
        assert.equal(error.name, 'EarnPayRequestError');
        assert.equal(error.status, 429);
        assert.equal(error.code, 'RATE_LIMITED');
        assert.equal(error.retryable, true);
        return true;
      },
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
