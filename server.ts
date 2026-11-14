import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import {
  INITIAL_CHAT_MESSAGES,
  INITIAL_CHAT_THREADS,
  INITIAL_CHANNELS,
  INITIAL_INTEGRATIONS,
  INITIAL_INTERNAL_BALANCES,
  INITIAL_ORDERS,
  INITIAL_POSTS,
  INITIAL_PRODUCTS,
  INITIAL_SESSIONS,
  INITIAL_TRANSACTIONS,
  INITIAL_USER_PROFILE,
} from './src/data/initialData.ts';
import type {
  ActiveSession,
  ChannelMember,
  ChannelPost,
  ChatMessage,
  ChatThread,
  CurrencyBalance,
  GroupPermissions,
  OrderRecord,
  PlatformId,
  PlatformIntegration,
  Product,
  StoreChannel,
  SupportTicket,
  SyncedStoreOrder,
  UserProfile,
  WalletTransactionRecord,
} from './src/types/commerce.ts';
import {
  canUserPostInGroup,
  isChannelAdmin,
  normalizeHandle,
  resolveGroupPermissions,
} from './src/utils/commerceLogic.ts';

interface ServerIntegrationSecret {
  platform: PlatformId;
  storeUrl: string;
  token: string;
  consumerKey?: string;
  consumerSecret?: string;
}

interface PersistedState {
  profile: UserProfile;
  channels: StoreChannel[];
  products: Product[];
  posts: ChannelPost[];
  threads: ChatThread[];
  messages: ChatMessage[];
  internalBalances: CurrencyBalance[];
  transactions: WalletTransactionRecord[];
  orders: OrderRecord[];
  integrations: PlatformIntegration[];
  syncedStoreOrders: SyncedStoreOrder[];
  sessions: ActiveSession[];
  supportTickets: SupportTicket[];
  secrets: Partial<Record<PlatformId, ServerIntegrationSecret>>;
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const STATE_FILE = path.join(DATA_DIR, 'store21-state.json');

function createDefaultState(): PersistedState {
  return {
    profile: structuredClone(INITIAL_USER_PROFILE),
    channels: structuredClone(INITIAL_CHANNELS),
    products: structuredClone(INITIAL_PRODUCTS),
    posts: structuredClone(INITIAL_POSTS),
    threads: structuredClone(INITIAL_CHAT_THREADS),
    messages: structuredClone(INITIAL_CHAT_MESSAGES),
    internalBalances: structuredClone(INITIAL_INTERNAL_BALANCES),
    transactions: structuredClone(INITIAL_TRANSACTIONS),
    orders: structuredClone(INITIAL_ORDERS),
    integrations: structuredClone(INITIAL_INTEGRATIONS),
    syncedStoreOrders: [],
    sessions: structuredClone(INITIAL_SESSIONS),
    supportTickets: [],
    secrets: {},
  };
}

function loadState(): PersistedState {
  const def = createDefaultState();
  try {
    if (fs.existsSync(STATE_FILE)) {
      const raw = fs.readFileSync(STATE_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<PersistedState>;
      const merged: PersistedState = { ...def, ...parsed };

      // Ensure channels and threads retain groupPermissions & member defaults if loaded from older snapshot
      merged.channels = (merged.channels || def.channels).map((ch) => {
        const seedCh = def.channels.find((d) => d.id === ch.id);
        return {
          ...ch,
          groupPermissions: resolveGroupPermissions(undefined, {
            ...(seedCh || ch),
            ...ch,
            groupPermissions: ch.groupPermissions || seedCh?.groupPermissions,
          }),
          members: Array.isArray(ch.members) ? ch.members : seedCh?.members || [],
        };
      });

      merged.threads = (merged.threads || def.threads).map((tr) => {
        const seedTr = def.threads.find((d) => d.id === tr.id);
        const linkedCh = merged.channels.find((c) => c.id === tr.channelId);
        return {
          ...tr,
          groupPermissions: tr.kind === 'group'
            ? resolveGroupPermissions({ ...(seedTr || tr), ...tr, groupPermissions: tr.groupPermissions || seedTr?.groupPermissions }, linkedCh)
            : tr.groupPermissions,
        };
      });

      return merged;
    }
  } catch {
    // Fallback to clean initial state if state file is unreadable
  }
  return def;
}

function saveState(state: PersistedState): void {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch {
    // Non-fatal in read-only filesystems
  }
}

function sanitizePublicState(state: PersistedState) {
  const { secrets: _secrets, ...publicState } = state;
  return publicState;
}

function maskCredential(secret: string): string {
  const trimmed = secret.trim();
  if (trimmed.length <= 6) return '••••••';
  return `${trimmed.slice(0, 4)}••••${trimmed.slice(-4)}`;
}

// Public EVM RPC endpoints for real balance & transaction receipt verification
const PUBLIC_EVM_RPCS: Record<string, { url: string; name: string; usdc?: string; usdt?: string }> = {
  '0x1': {
    url: 'https://cloudflare-eth.com',
    name: 'Ethereum Mainnet',
    usdc: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    usdt: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  },
  '0x89': {
    url: 'https://polygon-rpc.com',
    name: 'Polygon',
    usdc: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
    usdt: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
  },
  '0x2105': {
    url: 'https://mainnet.base.org',
    name: 'Base',
    usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  },
  '0xa4b1': {
    url: 'https://arb1.arbitrum.io/rpc',
    name: 'Arbitrum One',
    usdc: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    usdt: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
  },
  '0xaa36a7': {
    url: 'https://rpc.sepolia.org',
    name: 'Sepolia Testnet',
  },
};

async function rpcCall(rpcUrl: string, method: string, params: unknown[]) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  try {
    const res = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
      signal: controller.signal,
    });
    const json = (await res.json()) as { result?: unknown; error?: { message?: string } };
    if (json.error) throw new Error(json.error.message || 'RPC error');
    return json.result;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchErc20Balance(rpcUrl: string, tokenAddress: string, walletAddress: string, decimals = 6): Promise<number> {
  try {
    const cleanAddr = walletAddress.replace(/^0x/, '').toLowerCase().padStart(64, '0');
    const data = `0x70a08231${cleanAddr}`;
    const hexResult = (await rpcCall(rpcUrl, 'eth_call', [{ to: tokenAddress, data }, 'latest'])) as string;
    if (!hexResult || hexResult === '0x') return 0;
    const raw = BigInt(hexResult);
    return Number(raw) / Math.pow(10, decimals);
  } catch {
    return 0;
  }
}

async function callCommercePlatform(
  platform: PlatformId,
  creds: ServerIntegrationSecret,
  mode: 'products' | 'orders'
): Promise<{
  ok: boolean;
  error?: string;
  products?: Array<{ title: string; priceUSD: number; stock: number; sku: string; image?: string; description?: string }>;
  orders?: SyncedStoreOrder[];
}> {
  const baseUrl = creds.storeUrl.replace(/\/+$/, '');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);

  try {
    if (platform === 'shopify') {
      const endpoint = mode === 'products'
        ? `${baseUrl}/admin/api/2024-10/products.json?limit=10`
        : `${baseUrl}/admin/api/2024-10/orders.json?status=any&limit=10`;
      const res = await fetch(endpoint, {
        headers: {
          'X-Shopify-Access-Token': creds.token,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      if (!res.ok) {
        return { ok: false, error: `Shopify API HTTP ${res.status} (${res.statusText})` };
      }
      const data = (await res.json()) as Record<string, unknown>;
      if (mode === 'products') {
        const list = Array.isArray(data.products) ? data.products : [];
        const mapped = list.map((item: Record<string, unknown>, idx: number) => {
          const variants = Array.isArray(item.variants) ? (item.variants as Array<Record<string, unknown>>) : [];
          const firstVar = variants[0] || {};
          const images = Array.isArray(item.images) ? (item.images as Array<Record<string, unknown>>) : [];
          return {
            title: String(item.title || `Shopify Product ${idx + 1}`),
            priceUSD: Number(firstVar.price || 0),
            stock: Number(firstVar.inventory_quantity ?? 10),
            sku: String(firstVar.sku || `SHP-${item.id || idx}`),
            image: images[0]?.src ? String(images[0].src) : undefined,
            description: String(item.body_html || '').replace(/<[^>]*>/g, '').slice(0, 220),
          };
        });
        return { ok: true, products: mapped };
      }
      const ordersList = Array.isArray(data.orders) ? data.orders : [];
      return {
        ok: true,
        orders: ordersList.map((o: Record<string, unknown>, idx: number) => ({
          id: `ext-shp-${o.id || idx}`,
          platform: 'shopify',
          externalOrderNumber: String(o.name || o.order_number || idx),
          customerName: String((o.customer as Record<string, unknown> | undefined)?.first_name || 'Customer'),
          totalUSD: Number(o.total_price || 0),
          status: String(o.financial_status || 'pending'),
          createdAt: String(o.created_at || new Date().toISOString()).slice(0, 10),
        })),
      };
    }

    if (platform === 'woocommerce') {
      const key = creds.consumerKey || creds.token;
      const sec = creds.consumerSecret || '';
      const auth = Buffer.from(`${key}:${sec}`).toString('base64');
      const endpoint = mode === 'products'
        ? `${baseUrl}/wp-json/wc/v3/products?per_page=10`
        : `${baseUrl}/wp-json/wc/v3/orders?per_page=10`;
      const res = await fetch(endpoint, {
        headers: { Authorization: `Basic ${auth}` },
        signal: controller.signal,
      });
      if (!res.ok) {
        return { ok: false, error: `WooCommerce REST API HTTP ${res.status} (${res.statusText})` };
      }
      const list = (await res.json()) as Array<Record<string, unknown>>;
      if (mode === 'products') {
        return {
          ok: true,
          products: list.map((item, idx) => {
            const imgs = Array.isArray(item.images) ? (item.images as Array<Record<string, unknown>>) : [];
            return {
              title: String(item.name || `Woo Product ${idx + 1}`),
              priceUSD: Number(item.price || item.regular_price || 0),
              stock: Number(item.stock_quantity ?? 10),
              sku: String(item.sku || `WOO-${item.id || idx}`),
              image: imgs[0]?.src ? String(imgs[0].src) : undefined,
              description: String(item.short_description || '').replace(/<[^>]*>/g, '').slice(0, 220),
            };
          }),
        };
      }
      return {
        ok: true,
        orders: list.map((o, idx) => ({
          id: `ext-woo-${o.id || idx}`,
          platform: 'woocommerce',
          externalOrderNumber: `#${o.number || o.id || idx}`,
          customerName: String((o.billing as Record<string, unknown> | undefined)?.first_name || 'Customer'),
          totalUSD: Number(o.total || 0),
          status: String(o.status || 'processing'),
          createdAt: String(o.date_created || new Date().toISOString()).slice(0, 10),
        })),
      };
    }

    if (platform === 'salla') {
      const apiBase = baseUrl.includes('api.salla.dev') ? baseUrl : 'https://api.salla.dev/admin/v2';
      const endpoint = mode === 'products' ? `${apiBase}/products?per_page=10` : `${apiBase}/orders?per_page=10`;
      const res = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${creds.token}`,
          Accept: 'application/json',
        },
        signal: controller.signal,
      });
      if (!res.ok) {
        return { ok: false, error: `Salla API HTTP ${res.status} (${res.statusText})` };
      }
      const payload = (await res.json()) as { data?: Array<Record<string, unknown>> };
      const list = Array.isArray(payload.data) ? payload.data : [];
      if (mode === 'products') {
        return {
          ok: true,
          products: list.map((item, idx) => ({
            title: String(item.name || `Salla Product ${idx + 1}`),
            priceUSD: Number((item.price as Record<string, unknown> | undefined)?.amount || 0),
            stock: Number(item.quantity ?? 10),
            sku: String(item.sku || `SAL-${item.id || idx}`),
            image: item.main_image ? String(item.main_image) : undefined,
            description: String(item.description || '').replace(/<[^>]*>/g, '').slice(0, 220),
          })),
        };
      }
      return {
        ok: true,
        orders: list.map((o, idx) => ({
          id: `ext-sal-${o.id || idx}`,
          platform: 'salla',
          externalOrderNumber: `#${o.reference_id || o.id || idx}`,
          customerName: String((o.customer as Record<string, unknown> | undefined)?.first_name || 'Customer'),
          totalUSD: Number((o.amounts as Record<string, unknown> | undefined)?.total && ((o.amounts as Record<string, unknown>).total as Record<string, unknown>).amount || 0),
          status: String((o.status as Record<string, unknown> | undefined)?.name || 'pending'),
          createdAt: String(o.date || new Date().toISOString()).slice(0, 10),
        })),
      };
    }

    // Zid Merchant API
    const zidBase = baseUrl.includes('api.zid.sa') ? baseUrl : 'https://api.zid.sa/v1';
    const endpoint = mode === 'products'
      ? `${zidBase}/managers/store/products`
      : `${zidBase}/managers/store/orders`;
    const res = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${creds.token}`,
        Accept: 'application/json',
      },
      signal: controller.signal,
    });
    if (!res.ok) {
      return { ok: false, error: `Zid API HTTP ${res.status} (${res.statusText})` };
    }
    const payload = (await res.json()) as { results?: Array<Record<string, unknown>> };
    const list = Array.isArray(payload.results) ? payload.results : [];
    if (mode === 'products') {
      return {
        ok: true,
        products: list.map((item, idx) => ({
          title: String(item.name || `Zid Product ${idx + 1}`),
          priceUSD: Number(item.price || 0),
          stock: Number(item.quantity ?? 10),
          sku: String(item.sku || `ZID-${item.id || idx}`),
          description: String(item.short_description || '').slice(0, 220),
        })),
      };
    }
    return {
      ok: true,
      orders: list.map((o, idx) => ({
        id: `ext-zid-${o.id || idx}`,
        platform: 'zid',
        externalOrderNumber: `#${o.id || idx}`,
        customerName: String(o.customer_name || 'Customer'),
        totalUSD: Number(o.order_total || 0),
        status: String(o.order_status || 'new'),
        createdAt: String(o.created_at || new Date().toISOString()).slice(0, 10),
      })),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upstream network error';
    return { ok: false, error: `Connection failed: ${message}` };
  } finally {
    clearTimeout(timeout);
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '4mb' }));

  const state = loadState();

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'store-21' });
  });

  app.get('/api/bootstrap', (_req, res) => {
    res.json(sanitizePublicState(state));
  });

  app.put('/api/profile', (req, res) => {
    state.profile = { ...state.profile, ...req.body };
    saveState(state);
    res.json({ profile: state.profile });
  });

  app.post('/api/channels', (req, res) => {
    const ch = req.body as StoreChannel;
    if (!ch?.name?.trim()) {
      res.status(400).json({ error: 'Channel name is required' });
      return;
    }
    const normalizedChannel: StoreChannel = {
      ...ch,
      groupPermissions: resolveGroupPermissions(undefined, ch),
    };
    state.channels.unshift(normalizedChannel);
    if (normalizedChannel.linkedGroupEnabled) {
      state.threads.unshift({
        id: normalizedChannel.linkedGroupId,
        kind: 'group',
        channelId: normalizedChannel.id,
        title: normalizedChannel.linkedGroupName,
        titleEn: normalizedChannel.linkedGroupNameEn,
        subtitle: normalizedChannel.description,
        subtitleEn: normalizedChannel.descriptionEn,
        avatar: normalizedChannel.avatarImage,
        verified: normalizedChannel.verified,
        membersCount: normalizedChannel.members.length,
        unreadCount: 0,
        groupPermissions: normalizedChannel.groupPermissions,
      });
    }
    saveState(state);
    res.json({ channel: normalizedChannel, threads: state.threads });
  });

  app.patch('/api/channels/:id', (req, res) => {
    const { id } = req.params;
    const idx = state.channels.findIndex((c) => c.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Channel not found' });
      return;
    }
    state.channels[idx] = { ...state.channels[idx], ...req.body };
    saveState(state);
    res.json({ channel: state.channels[idx] });
  });

  app.post('/api/channels/:id/members', (req, res) => {
    const ch = state.channels.find((c) => c.id === req.params.id);
    if (!ch) {
      res.status(404).json({ error: 'Channel not found' });
      return;
    }
    if (!isChannelAdmin(ch, state.profile.username)) {
      res.status(403).json({ error: 'Only channel administrators can add or manage members.' });
      return;
    }
    const { name, handle, role } = req.body as {
      name: string;
      handle: string;
      role?: 'moderator' | 'member';
    };
    if (!name?.trim() || !handle?.trim()) {
      res.status(400).json({ error: 'Member name and handle are required' });
      return;
    }
    const formattedHandle = handle.trim().startsWith('@') ? handle.trim() : `@${handle.trim()}`;
    if (ch.members.some((m) => normalizeHandle(m.handle) === normalizeHandle(formattedHandle))) {
      res.status(409).json({ error: 'Member already exists in this channel' });
      return;
    }
    const newMember: ChannelMember = {
      id: `mem-${Date.now()}`,
      name: name.trim(),
      handle: formattedHandle,
      role: role === 'moderator' ? 'moderator' : 'member',
      muted: false,
      canPost: true,
      joinedAt: new Date().toISOString().slice(0, 10),
    };
    ch.members.push(newMember);
    const linkedThread = state.threads.find((t) => t.kind === 'group' && t.channelId === ch.id);
    if (linkedThread) {
      linkedThread.membersCount = Math.max(linkedThread.membersCount || 0, ch.members.length);
    }
    saveState(state);
    res.json({ channel: ch, member: newMember });
  });

  app.patch('/api/channels/:id/members/:memberId', (req, res) => {
    const ch = state.channels.find((c) => c.id === req.params.id);
    if (!ch) {
      res.status(404).json({ error: 'Channel not found' });
      return;
    }
    if (!isChannelAdmin(ch, state.profile.username)) {
      res.status(403).json({ error: 'Only channel administrators can modify member roles or permissions.' });
      return;
    }
    const member = ch.members.find((m) => m.id === req.params.memberId);
    if (!member) {
      res.status(404).json({ error: 'Member not found' });
      return;
    }
    const { role, muted, canPost } = req.body as Partial<Pick<ChannelMember, 'role' | 'muted' | 'canPost'>>;
    if (member.role !== 'owner' && (role === 'moderator' || role === 'member')) {
      member.role = role;
    }
    if (typeof muted === 'boolean' && member.role !== 'owner') {
      member.muted = muted;
    }
    if (typeof canPost === 'boolean') {
      member.canPost = canPost;
    }
    saveState(state);
    res.json({ channel: ch, member });
  });

  app.post('/api/products', (req, res) => {
    const { product, createPost } = req.body as { product: Product; createPost?: boolean };
    if (!product?.title?.trim()) {
      res.status(400).json({ error: 'Product title is required' });
      return;
    }
    const ch = state.channels.find((c) => c.id === product.channelId);
    if (ch && !isChannelAdmin(ch, state.profile.username)) {
      res.status(403).json({ error: 'Only channel administrators can publish products to this channel.' });
      return;
    }
    state.products.unshift(product);
    let createdPost: ChannelPost | null = null;
    if (createPost) {
      createdPost = {
        id: `post-${Date.now()}`,
        channelId: product.channelId,
        type: 'product',
        authorName: state.profile.name,
        authorHandle: state.profile.username,
        text: product.description,
        textEn: product.descriptionEn,
        productId: product.id,
        allowComments: true,
        timestamp: 'الآن',
        viewsCount: 1,
        reactions: { heart: 0, thumbs: 0, fire: 0 },
        comments: [],
      };
      state.posts.unshift(createdPost);
    }
    saveState(state);
    res.json({ product, post: createdPost });
  });

  app.patch('/api/products/:id/stock', (req, res) => {
    const { id } = req.params;
    const { delta } = req.body as { delta: number };
    const prod = state.products.find((p) => p.id === id);
    if (!prod) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    prod.stock = Math.max(0, prod.stock + Number(delta || 0));
    saveState(state);
    res.json({ product: prod });
  });

  app.post('/api/products/:id/reviews', (req, res) => {
    const { id } = req.params;
    const { author, rating, comment } = req.body as {
      author: string;
      rating: number;
      comment: string;
    };
    const prod = state.products.find((p) => p.id === id);
    if (!prod || !comment?.trim()) {
      res.status(400).json({ error: 'Product and review comment are required' });
      return;
    }
    const cleanRating = Math.min(5, Math.max(1, Number(rating) || 5));
    const review = {
      id: `rev-${Date.now()}`,
      author: author || state.profile.name,
      rating: cleanRating,
      comment: comment.trim(),
      commentEn: comment.trim(),
      date: new Date().toISOString().slice(0, 10),
    };
    prod.reviews.unshift(review);
    prod.reviewCount = prod.reviews.length;
    const avg = prod.reviews.reduce((sum, r) => sum + r.rating, 0) / prod.reviews.length;
    prod.rating = Number(avg.toFixed(1));
    saveState(state);
    res.json({ product: prod, review });
  });

  app.post('/api/posts', (req, res) => {
    const post = req.body as ChannelPost;
    if (!post?.channelId) {
      res.status(400).json({ error: 'Channel ID required' });
      return;
    }
    const ch = state.channels.find((c) => c.id === post.channelId);
    if (!ch) {
      res.status(404).json({ error: 'Channel not found' });
      return;
    }
    if (!isChannelAdmin(ch, state.profile.username)) {
      res.status(403).json({ error: 'Only channel administrators can publish posts in this channel.' });
      return;
    }
    const storedPost: ChannelPost = {
      ...post,
      authorName: post.authorName || state.profile.name,
      authorHandle: post.authorHandle || state.profile.username,
      allowComments: post.allowComments !== false,
    };
    state.posts.unshift(storedPost);
    saveState(state);
    res.json({ post: storedPost });
  });

  app.patch('/api/posts/:id/pin', (req, res) => {
    const post = state.posts.find((p) => p.id === req.params.id);
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }
    const ch = state.channels.find((c) => c.id === post.channelId);
    if (ch && !isChannelAdmin(ch, state.profile.username)) {
      res.status(403).json({ error: 'Only channel administrators can pin or unpin posts.' });
      return;
    }
    post.pinned = !post.pinned;
    saveState(state);
    res.json({ post });
  });

  app.post('/api/posts/:id/vote', (req, res) => {
    const { optionId } = req.body as { optionId: string };
    const post = state.posts.find((p) => p.id === req.params.id);
    if (!post || post.type !== 'poll' || !Array.isArray(post.pollOptions)) {
      res.status(404).json({ error: 'Poll post not found' });
      return;
    }
    const voter = normalizeHandle(state.profile.username) || 'guest';
    const targetOption = post.pollOptions.find((o) => o.id === optionId);
    if (!targetOption) {
      res.status(400).json({ error: 'Invalid poll option' });
      return;
    }
    const alreadyOnTarget = (targetOption.votedByHandles || []).some(
      (h) => normalizeHandle(h) === voter
    );
    post.pollOptions = post.pollOptions.map((opt) => {
      const list = (opt.votedByHandles || []).filter((h) => normalizeHandle(h) !== voter);
      const hadVote = (opt.votedByHandles || []).some((h) => normalizeHandle(h) === voter);
      let votes = hadVote ? Math.max(0, opt.votes - 1) : opt.votes;
      if (!alreadyOnTarget && opt.id === optionId) {
        list.push(state.profile.username);
        votes += 1;
      }
      return { ...opt, votes, votedByHandles: list };
    });
    saveState(state);
    res.json({ post });
  });

  app.post('/api/posts/:id/react', (req, res) => {
    const { id } = req.params;
    const { key } = req.body as { key: 'heart' | 'thumbs' | 'fire' };
    const post = state.posts.find((p) => p.id === id);
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }
    if (key === 'heart' || key === 'thumbs' || key === 'fire') {
      post.reactions[key] += 1;
    }
    saveState(state);
    res.json({ post });
  });

  app.post('/api/posts/:id/comments', (req, res) => {
    const { id } = req.params;
    const { author, text } = req.body as { author: string; text: string };
    const post = state.posts.find((p) => p.id === id);
    if (!post || !text?.trim()) {
      res.status(400).json({ error: 'Valid post and comment text required' });
      return;
    }
    if (post.allowComments === false) {
      res.status(403).json({ error: 'Comments are disabled on this post.' });
      return;
    }
    post.comments.push({
      id: `cmt-${Date.now()}`,
      author: author || state.profile.name,
      text: text.trim(),
      timestamp: 'الآن',
    });
    saveState(state);
    res.json({ post });
  });

  app.post('/api/posts/:id/live-chat', (req, res) => {
    const { id } = req.params;
    const { sender, role, text } = req.body as { sender: string; role: 'seller' | 'viewer'; text: string };
    const post = state.posts.find((p) => p.id === id);
    if (!post || !text?.trim()) {
      res.status(400).json({ error: 'Valid live post and message required' });
      return;
    }
    if (!post.liveChat) post.liveChat = [];
    post.liveChat.push({
      id: `lc-${Date.now()}`,
      sender: sender || state.profile.name,
      role: role || 'viewer',
      text: text.trim(),
      timestamp: 'الآن',
    });
    saveState(state);
    res.json({ post });
  });

  app.patch('/api/posts/:id/live-status', (req, res) => {
    const { id } = req.params;
    const { liveActive, hasReplay } = req.body as { liveActive: boolean; hasReplay?: boolean };
    const post = state.posts.find((p) => p.id === id);
    if (!post || post.type !== 'live') {
      res.status(404).json({ error: 'Live broadcast not found' });
      return;
    }
    const ch = state.channels.find((c) => c.id === post.channelId);
    if (ch && !isChannelAdmin(ch, state.profile.username)) {
      res.status(403).json({ error: 'Only channel administrators can control live broadcast status.' });
      return;
    }
    post.liveActive = Boolean(liveActive);
    post.hasReplay = typeof hasReplay === 'boolean' ? hasReplay : !post.liveActive;
    saveState(state);
    res.json({ post });
  });

  app.post('/api/chats/ensure-direct', (req, res) => {
    const { channelId } = req.body as { channelId: string };
    const ch = state.channels.find((c) => c.id === channelId);
    if (!ch) {
      res.status(404).json({ error: 'Channel not found' });
      return;
    }
    let thread = state.threads.find((t) => t.kind === 'direct' && t.channelId === channelId);
    if (!thread) {
      thread = {
        id: `thr-dir-${channelId}`,
        kind: 'direct',
        channelId,
        title: `${ch.ownerName} — ${ch.name}`,
        titleEn: `${ch.ownerNameEn} · ${ch.nameEn}`,
        subtitle: 'محادثة مباشرة مع البائع',
        subtitleEn: 'Direct seller conversation',
        avatar: ch.avatarImage,
        verified: ch.verified,
        online: true,
        lastSeen: 'متصل الآن',
        lastSeenEn: 'Online',
        unreadCount: 0,
      };
      state.threads.unshift(thread);
      saveState(state);
    }
    res.json({ thread, threads: state.threads });
  });

  app.post('/api/chats/join-group', (req, res) => {
    const { channelId } = req.body as { channelId: string };
    const ch = state.channels.find((c) => c.id === channelId);
    if (!ch || !ch.linkedGroupEnabled) {
      res.status(404).json({ error: 'Discussion group not available for this channel' });
      return;
    }
    const alreadyMember = ch.members.some(
      (m) => normalizeHandle(m.handle) === normalizeHandle(state.profile.username)
    );
    if (!alreadyMember) {
      ch.members.push({
        id: `mem-${Date.now()}`,
        name: state.profile.name,
        handle: state.profile.username,
        role: 'member',
        muted: false,
        canPost: true,
        joinedAt: new Date().toISOString().slice(0, 10),
      });
    }
    let thread = state.threads.find(
      (t) => t.kind === 'group' && (t.channelId === ch.id || t.id === ch.linkedGroupId)
    );
    if (!thread) {
      thread = {
        id: ch.linkedGroupId,
        kind: 'group',
        channelId: ch.id,
        title: ch.linkedGroupName,
        titleEn: ch.linkedGroupNameEn,
        subtitle: ch.linkedGroupDescription || ch.description,
        subtitleEn: ch.linkedGroupDescriptionEn || ch.descriptionEn,
        avatar: ch.avatarImage,
        verified: ch.verified,
        membersCount: Math.max(ch.members.length, 1),
        unreadCount: 0,
        groupPermissions: resolveGroupPermissions(undefined, ch),
      };
      state.threads.unshift(thread);
    } else {
      thread.membersCount = Math.max(thread.membersCount || 0, ch.members.length);
    }
    saveState(state);
    res.json({ thread, threads: state.threads, channel: ch });
  });

  app.patch('/api/threads/:id/permissions', (req, res) => {
    const thread = state.threads.find((t) => t.id === req.params.id);
    if (!thread || thread.kind !== 'group') {
      res.status(404).json({ error: 'Group thread not found' });
      return;
    }
    const ch = thread.channelId ? state.channels.find((c) => c.id === thread.channelId) : undefined;
    if (ch && !isChannelAdmin(ch, state.profile.username)) {
      res.status(403).json({ error: 'Only group administrators can modify group posting permissions.' });
      return;
    }
    const nextPermissions: GroupPermissions = {
      ...resolveGroupPermissions(thread, ch),
      ...(req.body as Partial<GroupPermissions>),
    };
    thread.groupPermissions = nextPermissions;
    if (ch) {
      ch.groupPermissions = nextPermissions;
    }
    saveState(state);
    res.json({ thread, channel: ch });
  });

  app.post('/api/chats/messages', (req, res) => {
    const msg = req.body as ChatMessage;
    if (
      !msg?.threadId ||
      (!msg.text?.trim() && !msg.attachedProductId && !msg.media && !msg.forwardedPost)
    ) {
      res.status(400).json({ error: 'Thread ID and content required' });
      return;
    }
    const thread = state.threads.find((t) => t.id === msg.threadId);
    const ch = thread?.channelId ? state.channels.find((c) => c.id === thread.channelId) : undefined;
    if (thread?.kind === 'group') {
      const check = canUserPostInGroup(thread, ch, state.profile.username);
      if (!check.allowed) {
        const reasonMap = {
          muted: 'You are muted in this group.',
          admins_only: 'Only group administrators can send messages right now.',
          not_approved: 'Sending messages is restricted to approved members.',
          ok: '',
        } as const;
        res.status(403).json({ error: reasonMap[check.reason] });
        return;
      }
      if (!check.isAdmin) {
        if (msg.media && !check.permissions.allowMedia) {
          res.status(403).json({ error: 'Media attachments are disabled for members in this group.' });
          return;
        }
        if ((msg.attachedProductId || msg.forwardedPost) && !check.permissions.allowProductLinks) {
          res.status(403).json({ error: 'Product links and forwards are disabled for members in this group.' });
          return;
        }
        if (msg.replyTo && !check.permissions.allowMemberReplies) {
          res.status(403).json({ error: 'Replies are disabled for members in this group.' });
          return;
        }
      }
    }
    const storedMsg: ChatMessage = {
      ...msg,
      deliveryStatus: msg.deliveryStatus || 'delivered',
    };
    state.messages.push(storedMsg);
    saveState(state);
    res.json({ message: storedMsg });
  });

  app.patch('/api/chats/messages/:id', (req, res) => {
    const { text } = req.body as { text: string };
    const msg = state.messages.find((m) => m.id === req.params.id);
    if (!msg || !text?.trim()) {
      res.status(400).json({ error: 'Valid message and text required' });
      return;
    }
    msg.text = text.trim();
    msg.edited = true;
    saveState(state);
    res.json({ message: msg });
  });

  app.delete('/api/chats/messages/:id', (req, res) => {
    const exists = state.messages.some((m) => m.id === req.params.id);
    if (!exists) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }
    state.messages = state.messages.filter((m) => m.id !== req.params.id);
    saveState(state);
    res.json({ deletedId: req.params.id });
  });

  app.post('/api/chats/messages/:id/pin', (req, res) => {
    const msg = state.messages.find((m) => m.id === req.params.id);
    if (!msg) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }
    msg.pinned = !msg.pinned;
    saveState(state);
    res.json({ message: msg });
  });

  app.post('/api/chats/messages/:id/react', (req, res) => {
    const msg = state.messages.find((m) => m.id === req.params.id);
    if (!msg) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }
    msg.reactions += 1;
    saveState(state);
    res.json({ message: msg });
  });

  // Real blockchain balance query (EVM JSON-RPC)
  app.post('/api/chain/evm-balance', async (req, res) => {
    const { address, chainIdHex } = req.body as { address: string; chainIdHex?: string };
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      res.status(400).json({ error: 'Invalid EVM wallet address format' });
      return;
    }
    const chainKey = (chainIdHex || '0x1').toLowerCase();
    const network = PUBLIC_EVM_RPCS[chainKey] || PUBLIC_EVM_RPCS['0x1'];

    try {
      const hexWei = (await rpcCall(network.url, 'eth_getBalance', [address, 'latest'])) as string;
      const ethAmount = Number(BigInt(hexWei || '0x0')) / 1e18;
      const usdcAmount = network.usdc ? await fetchErc20Balance(network.url, network.usdc, address, 6) : 0;
      const usdtAmount = network.usdt ? await fetchErc20Balance(network.url, network.usdt, address, 6) : 0;

      res.json({
        networkName: network.name,
        balances: [
          { currency: 'ETH', networkLabel: network.name, symbol: 'ETH', amount: Number(ethAmount.toFixed(6)), usdRate: 3150 },
          { currency: 'USDT', networkLabel: network.name, symbol: 'USDT', amount: Number(usdtAmount.toFixed(2)), usdRate: 1 },
          { currency: 'USDC', networkLabel: network.name, symbol: 'USDC', amount: Number(usdcAmount.toFixed(2)), usdRate: 1 },
        ],
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'RPC query failed';
      res.status(502).json({ error: `Unable to query ${network.name} RPC: ${msg}` });
    }
  });

  // Real Solana RPC balance query
  app.post('/api/chain/solana-balance', async (req, res) => {
    const { address } = req.body as { address: string };
    if (!address || address.length < 32 || address.length > 44) {
      res.status(400).json({ error: 'Invalid Solana public key' });
      return;
    }
    try {
      const result = (await rpcCall('https://api.mainnet-beta.solana.com', 'getBalance', [address])) as {
        value?: number;
      };
      const solAmount = Number(result?.value || 0) / 1e9;
      res.json({
        networkName: 'Solana Mainnet',
        balances: [
          { currency: 'SOL', networkLabel: 'Solana Mainnet', symbol: 'SOL', amount: Number(solAmount.toFixed(6)), usdRate: 210 },
        ],
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Solana RPC failed';
      res.status(502).json({ error: `Unable to query Solana Mainnet RPC: ${msg}` });
    }
  });

  // Verify real on-chain transaction hash against public JSON-RPC before recording deposit/payment
  app.post('/api/wallet/verify-tx', async (req, res) => {
    const { txHash, chainIdHex, amountUSD, currency, kind } = req.body as {
      txHash: string;
      chainIdHex?: string;
      amountUSD: number;
      currency: CurrencyBalance['currency'];
      kind: 'deposit' | 'order_payment';
    };

    if (!txHash || !/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
      res.status(400).json({ error: 'Invalid transaction hash format (expected 0x + 64 hex characters)' });
      return;
    }
    const chainKey = (chainIdHex || '0x1').toLowerCase();
    const network = PUBLIC_EVM_RPCS[chainKey] || PUBLIC_EVM_RPCS['0x1'];

    try {
      const receipt = (await rpcCall(network.url, 'eth_getTransactionReceipt', [txHash])) as {
        status?: string;
        blockNumber?: string;
      } | null;

      if (!receipt || receipt.status !== '0x1') {
        res.status(422).json({
          error: 'Transaction is not yet confirmed as successful on-chain (receipt missing or status != 0x1).',
        });
        return;
      }

      const txRec: WalletTransactionRecord = {
        id: `tx-${Date.now()}`,
        kind,
        source: 'external_onchain',
        currency,
        amount: Number(amountUSD) || 0,
        network: network.name,
        reference: txHash,
        status: 'verified_onchain',
        timestamp: new Date().toISOString().slice(0, 10),
        note: `Verified block ${parseInt(receipt.blockNumber || '0', 16)}`,
      };
      state.transactions.unshift(txRec);

      if (kind === 'deposit') {
        const bal = state.internalBalances.find((b) => b.currency === currency);
        if (bal) bal.amount += Number(amountUSD) || 0;
      }

      saveState(state);
      res.json({ transaction: txRec, internalBalances: state.internalBalances });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Verification RPC error';
      res.status(502).json({ error: `On-chain verification failed: ${msg}` });
    }
  });

  // Honest withdrawal validation strictly against verified internal balance
  app.post('/api/wallet/withdraw', (req, res) => {
    const { currency, amount, destination } = req.body as {
      currency: CurrencyBalance['currency'];
      amount: number;
      destination: string;
    };
    const asset = state.internalBalances.find((b) => b.currency === currency);
    if (!asset) {
      res.status(400).json({ error: 'Unsupported currency' });
      return;
    }
    if (!destination || destination.trim().length < 16) {
      res.status(400).json({ error: 'Valid destination wallet address is required' });
      return;
    }
    if (amount <= 0 || amount > asset.amount) {
      res.status(422).json({
        error: `Insufficient verified internal ${currency} balance (${asset.amount} available).`,
      });
      return;
    }
    asset.amount = Number((asset.amount - amount).toFixed(6));
    const txRec: WalletTransactionRecord = {
      id: `tx-${Date.now()}`,
      kind: 'withdrawal',
      source: 'internal',
      currency,
      amount,
      network: asset.networkLabel,
      reference: `WD-${Date.now().toString().slice(-6)}`,
      status: 'pending_backend_verification',
      timestamp: new Date().toISOString().slice(0, 10),
      note: `Destination: ${destination.slice(0, 10)}...`,
    };
    state.transactions.unshift(txRec);
    saveState(state);
    res.json({ transaction: txRec, internalBalances: state.internalBalances });
  });

  app.post('/api/orders', (req, res) => {
    const order = req.body as OrderRecord;
    state.orders.unshift(order);
    const txRec: WalletTransactionRecord = {
      id: `tx-ord-${Date.now()}`,
      kind: 'order_payment',
      source: order.paymentSource === 'external_wallet' ? 'external_onchain' : 'internal',
      currency: 'USD',
      amount: order.totalUSD,
      network: order.paymentSource === 'external_wallet' ? 'Web3 Wallet' : 'Store-21 Checkout',
      reference: order.txHash || order.referenceCode,
      status: order.status === 'verified_onchain' ? 'verified_onchain' : 'pending_backend_verification',
      timestamp: order.timestamp,
      note: order.storeName,
    };
    state.transactions.unshift(txRec);
    saveState(state);
    res.json({ order, transaction: txRec });
  });

  // Real store integration connection & API verification (secrets never leave server)
  app.post('/api/integrations/:platform/connect', async (req, res) => {
    const platform = req.params.platform as PlatformId;
    const { storeUrl, token, consumerKey, consumerSecret, channelId } = req.body as {
      storeUrl: string;
      token: string;
      consumerKey?: string;
      consumerSecret?: string;
      channelId?: string;
    };

    const integration = state.integrations.find((i) => i.id === platform);
    if (!integration) {
      res.status(404).json({ error: 'Unknown commerce platform' });
      return;
    }

    if (!storeUrl?.trim() || (!token?.trim() && !consumerKey?.trim())) {
      res.status(400).json({ error: 'Store URL and API credentials are required' });
      return;
    }

    const secretObj: ServerIntegrationSecret = {
      platform,
      storeUrl: storeUrl.trim(),
      token: (token || consumerKey || '').trim(),
      consumerKey: consumerKey?.trim(),
      consumerSecret: consumerSecret?.trim(),
    };

    integration.status = 'pending';
    integration.storeUrl = secretObj.storeUrl;
    integration.apiCredentialMasked = maskCredential(secretObj.token);
    integration.channelId = channelId || integration.channelId;

    const result = await callCommercePlatform(platform, secretObj, 'products');
    if (!result.ok) {
      integration.status = 'failed';
      integration.lastError = result.error || 'Authentication or network error';
      integration.lastSync = new Date().toISOString().slice(0, 16).replace('T', ' ');
      saveState(state);
      res.status(422).json({ integration, error: integration.lastError });
      return;
    }

    state.secrets[platform] = secretObj;
    integration.status = 'connected';
    integration.lastError = undefined;
    integration.lastSync = new Date().toISOString().slice(0, 16).replace('T', ' ');

    const imported = result.products || [];
    integration.syncedProductsCount = imported.length;

    const targetChannelId = integration.channelId || state.channels[0].id;
    const targetChannel = state.channels.find((c) => c.id === targetChannelId);
    if (targetChannel && !targetChannel.connectedPlatforms.includes(platform)) {
      targetChannel.connectedPlatforms.push(platform);
    }

    const addedProducts: Product[] = [];
    const addedPosts: ChannelPost[] = [];
    imported.forEach((imp, idx) => {
      const prodId = `prod-${platform}-${Date.now()}-${idx}`;
      const newProd: Product = {
        id: prodId,
        channelId: targetChannelId,
        title: imp.title,
        titleEn: imp.title,
        category: targetChannel?.category || 'متجر مربوط',
        categoryEn: targetChannel?.categoryEn || 'Synced Store',
        description: imp.description || `Imported from ${integration.name}`,
        descriptionEn: imp.description || `Imported from ${integration.name}`,
        priceUSD: imp.priceUSD,
        stock: imp.stock,
        image: imp.image || PRODUCT_IMAGES_FALLBACK,
        gallery: [imp.image || PRODUCT_IMAGES_FALLBACK],
        mediaPreference: 'images',
        has3D: false,
        model3d: 'vault',
        finish: 'titanium',
        sku: imp.sku,
        rating: 5.0,
        reviewCount: 0,
        syncedFrom: platform,
        specs: [`Synced via ${integration.name}`],
        specsEn: [`Synced via ${integration.name}`],
        reviews: [],
      };
      addedProducts.push(newProd);
      state.products.unshift(newProd);
      const post: ChannelPost = {
        id: `post-sync-${Date.now()}-${idx}`,
        channelId: targetChannelId,
        type: 'product',
        text: `${imp.title} — تمت مزامنته من ${integration.name}`,
        textEn: `${imp.title} — synced from ${integration.name}`,
        productId: prodId,
        timestamp: 'الآن',
        viewsCount: 1,
        reactions: { heart: 0, thumbs: 0, fire: 0 },
        comments: [],
      };
      addedPosts.push(post);
      state.posts.unshift(post);
    });

    saveState(state);
    res.json({ integration, importedProducts: addedProducts, createdPosts: addedPosts, channels: state.channels });
  });

  app.post('/api/integrations/:platform/sync', async (req, res) => {
    const platform = req.params.platform as PlatformId;
    const integration = state.integrations.find((i) => i.id === platform);
    const secretObj = state.secrets[platform];
    if (!integration || !secretObj) {
      res.status(400).json({ error: 'Store integration is not connected yet' });
      return;
    }

    const result = await callCommercePlatform(platform, secretObj, 'products');
    if (!result.ok) {
      integration.status = 'failed';
      integration.lastError = result.error;
      saveState(state);
      res.status(422).json({ integration, error: result.error });
      return;
    }

    integration.status = 'connected';
    integration.lastError = undefined;
    integration.lastSync = new Date().toISOString().slice(0, 16).replace('T', ' ');
    integration.syncedProductsCount = result.products?.length ?? integration.syncedProductsCount;
    saveState(state);
    res.json({ integration });
  });

  app.get('/api/integrations/:platform/orders', async (req, res) => {
    const platform = req.params.platform as PlatformId;
    const secretObj = state.secrets[platform];
    if (!secretObj) {
      res.status(400).json({ error: 'Platform not connected on server' });
      return;
    }
    const result = await callCommercePlatform(platform, secretObj, 'orders');
    if (!result.ok) {
      res.status(422).json({ error: result.error });
      return;
    }
    res.json({ orders: result.orders || [] });
  });

  app.post('/api/integrations/:platform/disconnect', (req, res) => {
    const platform = req.params.platform as PlatformId;
    const integration = state.integrations.find((i) => i.id === platform);
    if (!integration) {
      res.status(404).json({ error: 'Integration not found' });
      return;
    }
    delete state.secrets[platform];
    integration.status = 'disconnected';
    integration.apiCredentialMasked = '';
    integration.lastError = undefined;
    integration.lastSync = '—';
    saveState(state);
    res.json({ integration });
  });

  app.post('/api/sessions/:id/revoke', (req, res) => {
    state.sessions = state.sessions.filter((s) => s.id !== req.params.id || s.current);
    saveState(state);
    res.json({ sessions: state.sessions });
  });

  app.post('/api/support', (req, res) => {
    const { subject, message } = req.body as { subject: string; message: string };
    if (!subject?.trim() || !message?.trim()) {
      res.status(400).json({ error: 'Subject and message required' });
      return;
    }
    const ticket: SupportTicket = {
      id: `sup-${Date.now()}`,
      subject: subject.trim(),
      message: message.trim(),
      status: 'received',
      createdAt: new Date().toISOString().slice(0, 10),
    };
    state.supportTickets.unshift(ticket);
    saveState(state);
    res.json({ ticket });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use('/src/assets', express.static(path.resolve(process.cwd(), 'src/assets')));
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const port = Number(process.env.PORT || 3000);
  app.listen(port, '0.0.0.0', () => {
    console.log(`Store-21 server listening on http://localhost:${port}`);
  });
}

const PRODUCT_IMAGES_FALLBACK = '/src/assets/images/product_hardware_vault_1794600592340.jpg';

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
