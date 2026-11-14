import type {
  CartItem,
  ChannelPost,
  ChatMessage,
  ChatThread,
  CurrencyBalance,
  ExternalWalletConnection,
  Product,
} from '../types/commerce.ts';

export type ChatKindFilter = 'all' | 'direct' | 'group';

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

