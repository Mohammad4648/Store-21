import type {
  CartItem,
  ChannelMember,
  ChannelPost,
  ChatMessage,
  ChatThread,
  CurrencyBalance,
  ExternalWalletConnection,
  GroupPermissions,
  Product,
  StoreChannel,
} from '../types/commerce.ts';

export type ChatKindFilter = 'all' | 'direct' | 'group';

export const DEFAULT_GROUP_PERMISSIONS: GroupPermissions = {
  postingPolicy: 'all',
  allowMedia: true,
  allowProductLinks: true,
  allowMemberReplies: true,
};

export function normalizeHandle(handle?: string): string {
  return (handle || '').trim().toLowerCase().replace(/^@/, '');
}

export function getChannelMemberRole(
  channel: StoreChannel | undefined,
  userHandle: string
): ChannelMember['role'] | null {
  if (!channel) return null;
  const target = normalizeHandle(userHandle);
  if (!target) return null;
  const member = channel.members.find((m) => normalizeHandle(m.handle) === target);
  return member ? member.role : null;
}

export function isChannelAdmin(
  channel: StoreChannel | undefined,
  userHandle: string
): boolean {
  const role = getChannelMemberRole(channel, userHandle);
  return role === 'owner' || role === 'moderator';
}

export function resolveGroupPermissions(
  thread?: ChatThread,
  channel?: StoreChannel
): GroupPermissions {
  return {
    ...DEFAULT_GROUP_PERMISSIONS,
    ...(channel?.groupPermissions || {}),
    ...(thread?.groupPermissions || {}),
  };
}

export function canUserPostInGroup(
  thread: ChatThread | undefined,
  channel: StoreChannel | undefined,
  userHandle: string
): {
  allowed: boolean;
  reason: 'ok' | 'muted' | 'admins_only' | 'not_approved';
  isAdmin: boolean;
  permissions: GroupPermissions;
} {
  const permissions = resolveGroupPermissions(thread, channel);
  if (!thread || thread.kind === 'direct') {
    return { allowed: true, reason: 'ok', isAdmin: false, permissions };
  }

  const target = normalizeHandle(userHandle);
  const member = channel?.members.find((m) => normalizeHandle(m.handle) === target);
  const isAdmin = member ? member.role === 'owner' || member.role === 'moderator' : false;

  if (member?.muted) {
    return { allowed: false, reason: 'muted', isAdmin, permissions };
  }

  if (permissions.postingPolicy === 'admins_only' && !isAdmin) {
    return { allowed: false, reason: 'admins_only', isAdmin, permissions };
  }

  if (permissions.postingPolicy === 'approved_only' && !isAdmin && member?.canPost === false) {
    return { allowed: false, reason: 'not_approved', isAdmin, permissions };
  }

  if (permissions.postingPolicy === 'approved_only' && !isAdmin && !member) {
    return { allowed: false, reason: 'not_approved', isAdmin, permissions };
  }

  return { allowed: true, reason: 'ok', isAdmin, permissions };
}

export function sortChannelPostsPinnedFirst(posts: ChannelPost[]): ChannelPost[] {
  return [...posts].sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)));
}

export function filterChatThreads(
  threads: ChatThread[],
  kindFilter: ChatKindFilter,
  search: string
): ChatThread[] {
  const q = search.trim().toLowerCase();
  return threads
    .filter((thr) => (kindFilter === 'all' ? true : thr.kind === kindFilter))
    .filter((thr) => {
      if (!q) return true;
      return (
        thr.title.toLowerCase().includes(q) ||
        thr.titleEn.toLowerCase().includes(q) ||
        thr.subtitle.toLowerCase().includes(q) ||
        thr.subtitleEn.toLowerCase().includes(q)
      );
    });
}

export function filterMessagesInThread(
  messages: ChatMessage[],
  threadId: string,
  search: string
): ChatMessage[] {
  const q = search.trim().toLowerCase();
  return messages
    .filter((m) => m.threadId === threadId)
    .filter((m) => {
      if (!q) return true;
      return (
        m.text.toLowerCase().includes(q) ||
        m.authorName.toLowerCase().includes(q)
      );
    });
}

export function getChannelContentCounts(
  posts: ChannelPost[],
  products: Product[],
  channelId: string
): { posts: number; products: number; live: number } {
  const chPosts = posts.filter((p) => p.channelId === channelId);
  return {
    posts: chPosts.length,
    products: products.filter((p) => p.channelId === channelId).length,
    live: chPosts.filter((p) => p.type === 'live').length,
  };
}

export function computeCartSummary(cart: CartItem[]): { itemCount: number; subtotalUSD: number } {
  let itemCount = 0;
  let subtotalUSD = 0;
  for (const item of cart) {
    const qty = Math.max(0, item.quantity);
    itemCount += qty;
    subtotalUSD += item.product.priceUSD * qty;
  }
  return {
    itemCount,
    subtotalUSD: Number(subtotalUSD.toFixed(2)),
  };
}

export function computePortfolioBalances(
  internalBalances: CurrencyBalance[],
  externalWallets: ExternalWalletConnection[]
): { internalUSD: number; externalUSD: number; totalUSD: number } {
  const internalUSD = internalBalances.reduce((sum, b) => sum + b.amount * b.usdRate, 0);
  const externalUSD = externalWallets.reduce(
    (sum, w) => sum + w.balances.reduce((s, b) => s + b.amount * b.usdRate, 0),
    0
  );
  return {
    internalUSD: Number(internalUSD.toFixed(2)),
    externalUSD: Number(externalUSD.toFixed(2)),
    totalUSD: Number((internalUSD + externalUSD).toFixed(2)),
  };
}

export function localizeTimestamp(ts: string, lang: 'ar' | 'en'): string {
  if (lang === 'ar') return ts;
  const map: Record<string, string> = {
    'الآن': 'Now',
    'الآن · مباشر': 'Now · Live',
    'قبل 20 دقيقة': '20m ago',
    'قبل ساعة': '1h ago',
    'قبل ساعتين': '2h ago',
    'قبل 3 ساعات': '3h ago',
  };
  return map[ts] || ts;
}

export function getCartItemKey(item: Pick<CartItem, 'product' | 'selectedFinish'>): string {
  return `${item.product.id}::${item.selectedFinish}`;
}

export function pruneSelectedCartKeys(cart: CartItem[], selectedKeys: string[]): string[] {
  const validKeys = new Set(cart.map(getCartItemKey));
  return selectedKeys.filter((k) => validKeys.has(k));
}

export function toggleCartItemSelection(selectedKeys: string[], key: string): string[] {
  if (selectedKeys.includes(key)) {
    return selectedKeys.filter((k) => k !== key);
  }
  return [...selectedKeys, key];
}

export function toggleSelectAllCartItems(cart: CartItem[], selectedKeys: string[]): string[] {
  if (cart.length === 0) return [];
  const valid = new Set(pruneSelectedCartKeys(cart, selectedKeys));
  const allKeys = cart.map(getCartItemKey);
  if (allKeys.every((k) => valid.has(k))) {
    return [];
  }
  return allKeys;
}

export function removeSelectedCartItems(cart: CartItem[], selectedKeys: string[]): CartItem[] {
  if (selectedKeys.length === 0) return cart;
  const toRemove = new Set(selectedKeys);
  return cart.filter((item) => !toRemove.has(getCartItemKey(item)));
}

export function getCartSelectionState(
  cart: CartItem[],
  selectedKeys: string[]
): {
  selectedCount: number;
  totalCount: number;
  allSelected: boolean;
  someSelected: boolean;
  selectedSubtotalUSD: number;
} {
  const validSet = new Set(pruneSelectedCartKeys(cart, selectedKeys));
  const totalCount = cart.length;
  const selectedCount = validSet.size;
  const allSelected = totalCount > 0 && selectedCount === totalCount;
  const someSelected = selectedCount > 0 && selectedCount < totalCount;
  let selectedSubtotalUSD = 0;
  for (const item of cart) {
    if (validSet.has(getCartItemKey(item))) {
      selectedSubtotalUSD += item.product.priceUSD * Math.max(0, item.quantity);
    }
  }
  return {
    selectedCount,
    totalCount,
    allSelected,
    someSelected,
    selectedSubtotalUSD: Number(selectedSubtotalUSD.toFixed(2)),
  };
}
