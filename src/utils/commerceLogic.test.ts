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
  canUserPostInGroup,
  computeCartSummary,
  computePortfolioBalances,
  filterChatThreads,
  filterMessagesInThread,
  getCartItemKey,
  getCartSelectionState,
  getChannelContentCounts,
  isChannelAdmin,
  localizeTimestamp,
  pruneSelectedCartKeys,
  removeSelectedCartItems,
  sortChannelPostsPinnedFirst,
  toggleCartItemSelection,
  toggleSelectAllCartItems,
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

test('isChannelAdmin allows owner/moderator and blocks regular members', () => {
  const tech = INITIAL_CHANNELS.find((c) => c.id === 'ch-tech');
  const oud = INITIAL_CHANNELS.find((c) => c.id === 'ch-oud');
  assert.equal(isChannelAdmin(tech, '@ahmed21'), true);
  assert.equal(isChannelAdmin(tech, '@faisal_d'), false);
  assert.equal(isChannelAdmin(oud, '@ahmed21'), false);
  assert.equal(isChannelAdmin(oud, '@sarah_oud'), true);
});

test('canUserPostInGroup enforces customizable group posting policies', () => {
  const techThread = INITIAL_CHAT_THREADS.find((t) => t.id === 'thr-grp-tech');
  const techCh = INITIAL_CHANNELS.find((c) => c.id === 'ch-tech');
  assert.equal(canUserPostInGroup(techThread, techCh, '@faisal_d').allowed, true);

  const oudThread = INITIAL_CHAT_THREADS.find((t) => t.id === 'thr-grp-oud');
  const oudCh = INITIAL_CHANNELS.find((c) => c.id === 'ch-oud');
  const resMember = canUserPostInGroup(oudThread, oudCh, '@ahmed21');
  assert.equal(resMember.allowed, false);
  assert.equal(resMember.reason, 'admins_only');

  const resOwner = canUserPostInGroup(oudThread, oudCh, '@sarah_oud');
  assert.equal(resOwner.allowed, true);
});

test('sortChannelPostsPinnedFirst puts pinned posts first without mutating input', () => {
  const sorted = sortChannelPostsPinnedFirst([
    { ...INITIAL_POSTS[0], id: 'a', pinned: false },
    { ...INITIAL_POSTS[0], id: 'b', pinned: true },
  ]);
  assert.equal(sorted[0].id, 'b');
  assert.equal(sorted[1].id, 'a');
});

test('cart multi-select supports Select All, partial toggle, pruning, and Remove Selected', () => {
  const sampleCart = [
    { product: INITIAL_PRODUCTS[0], quantity: 2, selectedFinish: 'titanium' as const },
    { product: INITIAL_PRODUCTS[1], quantity: 1, selectedFinish: 'gold' as const },
  ];
  const key0 = getCartItemKey(sampleCart[0]);
  const key1 = getCartItemKey(sampleCart[1]);

  // Select All selects all items
  const allSelected = toggleSelectAllCartItems(sampleCart, []);
  assert.deepEqual(allSelected, [key0, key1]);
  assert.deepEqual(getCartSelectionState(sampleCart, allSelected), {
    selectedCount: 2,
    totalCount: 2,
    allSelected: true,
    someSelected: false,
    selectedSubtotalUSD: Number(
      (INITIAL_PRODUCTS[0].priceUSD * 2 + INITIAL_PRODUCTS[1].priceUSD).toFixed(2)
    ),
  });

  // Uncheck one -> partial/indeterminate state
  const partial = toggleCartItemSelection(allSelected, key0);
  assert.deepEqual(partial, [key1]);
  const partialState = getCartSelectionState(sampleCart, partial);
  assert.equal(partialState.allSelected, false);
  assert.equal(partialState.someSelected, true);
  assert.equal(partialState.selectedCount, 1);

  // Toggle Select All from partial -> selects all; toggle from all -> clears all
  assert.deepEqual(toggleSelectAllCartItems(sampleCart, partial), [key0, key1]);
  assert.deepEqual(toggleSelectAllCartItems(sampleCart, [key0, key1]), []);

  // Remove selected deletes only checked items
  const remaining = removeSelectedCartItems(sampleCart, partial);
  assert.equal(remaining.length, 1);
  assert.equal(getCartItemKey(remaining[0]), key0);

  // Prune drops stale keys when items leave the cart
  assert.deepEqual(pruneSelectedCartKeys(remaining, [key0, key1]), [key0]);
});

