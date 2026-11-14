import assert from 'node:assert/strict';
import test from 'node:test';
import {
  INITIAL_CHANNELS,
  INITIAL_CHAT_MESSAGES,
  INITIAL_CHAT_THREADS,
  INITIAL_INTERNAL_BALANCES,
  INITIAL_POSTS,
  INITIAL_PRODUCTS,
} from '../data/initialData.ts';
import {
  computeCartSummary,
  computePortfolioBalances,
  filterChatThreads,
  filterMessagesInThread,
  getChannelContentCounts,
  localizeTimestamp,
} from './commerceLogic.ts';

test('filterChatThreads filters unified private and group threads by kind and search', () => {
  const all = filterChatThreads(INITIAL_CHAT_THREADS, 'all', '');
  assert.equal(all.length, INITIAL_CHAT_THREADS.length);

  const directOnly = filterChatThreads(INITIAL_CHAT_THREADS, 'direct', '');
  assert.ok(directOnly.length > 0 && directOnly.every((t) => t.kind === 'direct'));

  const groupOnly = filterChatThreads(INITIAL_CHAT_THREADS, 'group', '');
  assert.ok(groupOnly.length > 0 && groupOnly.every((t) => t.kind === 'group'));

  const bySearch = filterChatThreads(INITIAL_CHAT_THREADS, 'all', 'Tariq');
  assert.equal(bySearch.length, 1);
  assert.equal(bySearch[0].id, 'thr-dir-tech');
});

test('filterMessagesInThread scopes to active thread and supports keyword search', () => {
  const allForTechGroup = filterMessagesInThread(INITIAL_CHAT_MESSAGES, 'thr-grp-tech', '');
  assert.equal(allForTechGroup.length, 2);

  const matching = filterMessagesInThread(INITIAL_CHAT_MESSAGES, 'thr-grp-tech', 'البلاتيني');
  assert.equal(matching.length, 1);
  assert.equal(matching[0].id, 'cm-2');
});

test('getChannelContentCounts calculates posts, products, and live streams for a channel', () => {
  const chId = INITIAL_CHANNELS[0].id;
  const counts = getChannelContentCounts(INITIAL_POSTS, INITIAL_PRODUCTS, chId);
  assert.ok(counts.posts >= 2);
  assert.equal(counts.products, INITIAL_PRODUCTS.filter((p) => p.channelId === chId).length);
  assert.equal(counts.live, 1);
});

test('computeCartSummary accurately sums quantities and subtotal USD', () => {
  const summary = computeCartSummary([
    { product: INITIAL_PRODUCTS[0], quantity: 2, selectedFinish: 'titanium' },
    { product: INITIAL_PRODUCTS[1], quantity: 1, selectedFinish: 'gold' },
  ]);
  assert.equal(summary.itemCount, 3);
  const expected = Number((INITIAL_PRODUCTS[0].priceUSD * 2 + INITIAL_PRODUCTS[1].priceUSD).toFixed(2));
  assert.equal(summary.subtotalUSD, expected);
});

test('computePortfolioBalances separates internal and external balances cleanly', () => {
  const balances = computePortfolioBalances(INITIAL_INTERNAL_BALANCES, [
    {
      provider: 'metamask',
      label: 'MetaMask',
      address: '0x000000000000000000000000000000000000dead',
      networkName: 'Ethereum Mainnet',
      connectedAt: '2026-01-01',
      readOnly: true,
      balances: [
        { currency: 'ETH', networkLabel: 'Ethereum Mainnet', symbol: 'ETH', amount: 1, usdRate: 3000 },
        { currency: 'USDC', networkLabel: 'Ethereum Mainnet', symbol: 'USDC', amount: 250, usdRate: 1 },
      ],
    },
  ]);
  assert.equal(balances.internalUSD, 0);
  assert.equal(balances.externalUSD, 3250);
  assert.equal(balances.totalUSD, 3250);
});

test('localizeTimestamp translates relative Arabic timestamps in English mode', () => {
  assert.equal(localizeTimestamp('قبل ساعة', 'en'), '1h ago');
  assert.equal(localizeTimestamp('الآن · مباشر', 'en'), 'Now · Live');
  assert.equal(localizeTimestamp('قبل ساعة', 'ar'), 'قبل ساعة');
});

