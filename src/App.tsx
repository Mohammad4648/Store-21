import React, { useEffect, useState } from 'react';
import { Store21Mark } from './components/BrandIcons';
import { CartDrawer } from './components/CartDrawer';
import { ChannelsPage } from './components/ChannelsPage';
import { ChatsPage } from './components/ChatsPage';
import { HomePage } from './components/HomePage';
import {
  DesktopSidebar,
  MobileBottomNav,
  TopBar,
} from './components/Navbar';
import { ProductDetailModal } from './components/ProductDetailModal';
import { ProfilePage, ProfileSubTab } from './components/ProfilePage';
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
  PRODUCT_IMAGES,
} from './data/initialData';
import {
  ActiveSession,
  CartItem,
  ChannelPost,
  ChatMessage,
  ChatThread,
  CurrencyBalance,
  ExternalWalletConnection,
  Language,
  MessageMediaAttachment,
  OrderRecord,
  PlatformId,
  PlatformIntegration,
  PrimarySection,
  Product,
  ProductFinish,
  StoreChannel,
  SupportedCurrency,
  SupportTicket,
  SyncedStoreOrder,
  UserProfile,
  WalletProviderId,
  WalletTransactionRecord,
} from './types/commerce';

interface Eip1193Provider {
  isMetaMask?: boolean;
  isTrust?: boolean;
  isCoinbaseWallet?: boolean;
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

interface Eip6963AnnounceDetail {
  info: { uuid: string; name: string; rdns: string };
  provider: Eip1193Provider;
}

declare global {
  interface Window {
    ethereum?: Eip1193Provider & { providers?: Eip1193Provider[] };
    solana?: {
      isPhantom?: boolean;
      connect: () => Promise<{ publicKey: { toString: () => string } }>;
      disconnect?: () => Promise<void>;
    };
  }
}

export default function App() {
  const [lang, setLang] = useState<Language>('ar');
  const [activeSection, setActiveSection] = useState<PrimarySection>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [loggedOut, setLoggedOut] = useState(false);

  // Core persisted app state (hydrated from /api/bootstrap)
  const [profile, setProfile] = useState<UserProfile>(INITIAL_USER_PROFILE);
  const [channels, setChannels] = useState<StoreChannel[]>(INITIAL_CHANNELS);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [posts, setPosts] = useState<ChannelPost[]>(INITIAL_POSTS);
  const [threads, setThreads] = useState<ChatThread[]>(INITIAL_CHAT_THREADS);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_CHAT_MESSAGES);
  const [internalBalances, setInternalBalances] = useState<CurrencyBalance[]>(INITIAL_INTERNAL_BALANCES);
  const [transactions, setTransactions] = useState<WalletTransactionRecord[]>(INITIAL_TRANSACTIONS);
  const [orders, setOrders] = useState<OrderRecord[]>(INITIAL_ORDERS);
  const [integrations, setIntegrations] = useState<PlatformIntegration[]>(INITIAL_INTEGRATIONS);
  const [sessions, setSessions] = useState<ActiveSession[]>(INITIAL_SESSIONS);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);

  // Active selection states
  const [profileTab, setProfileTab] = useState<ProfileSubTab>('account');
  const [activeChannelId, setActiveChannelId] = useState<string>(INITIAL_CHANNELS[0].id);
  const [activeChatId, setActiveChatId] = useState<string>(
    () => INITIAL_CHAT_THREADS[0]?.id || 'thr-dir-tech'
  );

  // External Web3 wallets & EIP-6963 discovery
  const [externalWallets, setExternalWallets] = useState<ExternalWalletConnection[]>([]);
  const [discoveredProviders, setDiscoveredProviders] = useState<Eip6963AnnounceDetail[]>([]);

  // Cart & Product Modal
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedProductModal, setSelectedProductModal] = useState<{
    productId: string;
    mode: 'images' | 'video' | '3d';
  } | null>(null);

  const [toast, setToast] = useState<string | null>(null);
  const walletConnectProjectId = (import.meta as { env?: Record<string, string | undefined> }).env
    ?.VITE_WALLETCONNECT_PROJECT_ID;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  // Document direction & language
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  // Hydrate initial state from backend server
  useEffect(() => {
    fetch('/api/bootstrap')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        if (data.profile) setProfile(data.profile);
        if (Array.isArray(data.channels) && data.channels.length > 0) {
          setChannels(data.channels);
          setActiveChannelId(data.channels[0].id);
        }
        if (Array.isArray(data.products)) setProducts(data.products);
        if (Array.isArray(data.posts)) setPosts(data.posts);
        if (Array.isArray(data.threads) && data.threads.length > 0) {
          setThreads(data.threads);
          setActiveChatId((prev) =>
            (data.threads as ChatThread[]).some((t) => t.id === prev) ? prev : data.threads[0].id
          );
        }
        if (Array.isArray(data.messages)) setMessages(data.messages);
        if (Array.isArray(data.internalBalances)) setInternalBalances(data.internalBalances);
        if (Array.isArray(data.transactions)) setTransactions(data.transactions);
        if (Array.isArray(data.orders)) setOrders(data.orders);
        if (Array.isArray(data.integrations)) setIntegrations(data.integrations);
        if (Array.isArray(data.sessions)) setSessions(data.sessions);
        if (Array.isArray(data.supportTickets)) setSupportTickets(data.supportTickets);
      })
      .catch(() => {
        // Keep initial state if server is temporarily unavailable
      });
  }, []);

  // EIP-6963 Multi-wallet discovery listener
  useEffect(() => {
    const onAnnounce = (event: Event) => {
      const detail = (event as CustomEvent<Eip6963AnnounceDetail>).detail;
      if (!detail?.provider) return;
      setDiscoveredProviders((prev) =>
        prev.some((p) => p.info.uuid === detail.info.uuid) ? prev : [...prev, detail]
      );
    };
    window.addEventListener('eip6963:announceProvider', onAnnounce);
    window.dispatchEvent(new Event('eip6963:requestProvider'));
    return () => window.removeEventListener('eip6963:announceProvider', onAnnounce);
  }, []);

  // Helper: fetch real EVM or Solana RPC balances via backend
  const fetchChainBalances = async (
    address: string,
    kind: 'evm' | 'solana',
    chainIdHex?: string
  ): Promise<{ networkName: string; balances: CurrencyBalance[]; error?: string }> => {
    try {
      const endpoint = kind === 'evm' ? '/api/chain/evm-balance' : '/api/chain/solana-balance';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, chainIdHex }),
      });
      const json = await res.json();
      if (!res.ok) {
        return { networkName: kind === 'evm' ? 'Ethereum' : 'Solana', balances: [], error: json.error };
      }
      return { networkName: json.networkName, balances: json.balances || [] };
    } catch (err) {
      return {
        networkName: kind === 'evm' ? 'Ethereum' : 'Solana',
        balances: [],
        error: err instanceof Error ? err.message : 'RPC error',
      };
    }
  };

  const resolveEip1193Provider = (target: WalletProviderId): Eip1193Provider | null => {
    const byRdns = discoveredProviders.find((p) => {
      const name = p.info.name.toLowerCase();
      if (target === 'metamask') return name.includes('metamask');
      if (target === 'trust') return name.includes('trust');
      if (target === 'coinbase') return name.includes('coinbase');
      return false;
    });
    if (byRdns) return byRdns.provider;

    const list = window.ethereum?.providers || (window.ethereum ? [window.ethereum] : []);
    if (target === 'metamask') return list.find((p) => p.isMetaMask && !p.isTrust) || list[0] || null;
    if (target === 'trust') return list.find((p) => p.isTrust) || null;
    if (target === 'coinbase') return list.find((p) => p.isCoinbaseWallet) || null;
    return null;
  };

  const handleConnectProvider = async (
    provider: WalletProviderId
  ): Promise<{ ok: boolean; message: string }> => {
    if (provider === 'walletconnect') {
      if (!walletConnectProjectId) {
        return {
          ok: false,
          message:
            lang === 'ar'
              ? 'بروتوكول WalletConnect v2 يتطلب ضبط VITE_WALLETCONNECT_PROJECT_ID في البيئة، أو يمكنك استخدام استعلام العنوان العام للقراءة فقط أدناه.'
              : 'WalletConnect v2 requires VITE_WALLETCONNECT_PROJECT_ID in environment configuration. You can connect a browser extension or run a Read-Only Public Address lookup below.',
        };
      }
    }

    if (provider === 'solana') {
      if (!window.solana) {
        return {
          ok: false,
          message:
            lang === 'ar'
              ? 'لم يتم العثور على محفظة Solana (مثل Phantom) في هذا المتصفح. يمكنك إدخال عنوان Solana العام أدناه للتحقق من الرصيد عبر RPC.'
              : 'No Solana wallet extension (e.g. Phantom) detected in this browser. Use Read-Only Public Wallet Lookup below to query real SOL balances.',
        };
      }
      try {
        const resp = await window.solana.connect();
        const address = resp.publicKey.toString();
        const rpcData = await fetchChainBalances(address, 'solana');
        setExternalWallets((prev) => [
          ...prev.filter((w) => w.address !== address),
          {
            provider: 'solana',
            label: window.solana?.isPhantom ? 'Phantom (Solana)' : 'Solana Wallet',
            address,
            networkName: rpcData.networkName,
            connectedAt: new Date().toISOString().slice(0, 10),
            readOnly: false,
            balances: rpcData.balances,
            balanceError: rpcData.error,
          },
        ]);
        return {
          ok: true,
          message: lang === 'ar' ? 'تم ربط محفظة Solana وجلب الرصيد الفعلي.' : 'Solana wallet connected and live RPC balance loaded.',
        };
      } catch (err) {
        return { ok: false, message: err instanceof Error ? err.message : 'Solana connection rejected' };
      }
    }

    const eipProvider = resolveEip1193Provider(provider);
    if (!eipProvider) {
      return {
        ok: false,
        message:
          lang === 'ar'
            ? `لم يتم اكتشاف إضافة ${provider} في المتصفح الحالي. ثبّت الإضافة أو استخدم استعلام العنوان العام للقراءة فقط.`
            : `No ${provider} browser extension detected in this session. Install the wallet extension or use Read-Only Public Address lookup below.`,
      };
    }

    try {
      const accounts = (await eipProvider.request({ method: 'eth_requestAccounts' })) as string[];
      const address = accounts?.[0];
      if (!address) {
        return { ok: false, message: 'No wallet account returned by provider.' };
      }
      const chainIdHex = (await eipProvider.request({ method: 'eth_chainId' })) as string;
      const rpcData = await fetchChainBalances(address, 'evm', chainIdHex);
      const labelMap: Record<WalletProviderId, string> = {
        metamask: 'MetaMask',
        trust: 'Trust Wallet',
        coinbase: 'Coinbase Wallet',
        walletconnect: 'WalletConnect',
        solana: 'Solana',
      };
      setExternalWallets((prev) => [
        ...prev.filter((w) => w.address.toLowerCase() !== address.toLowerCase()),
        {
          provider,
          label: labelMap[provider],
          address,
          chainIdHex,
          networkName: rpcData.networkName,
          connectedAt: new Date().toISOString().slice(0, 10),
          readOnly: false,
          balances: rpcData.balances,
          balanceError: rpcData.error,
        },
      ]);
      return {
        ok: true,
        message: lang === 'ar' ? `تم ربط ${labelMap[provider]} بنجاح وجلب الأرصدة الفعلية.` : `${labelMap[provider]} connected with live RPC balances.`,
      };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : 'Wallet authorization cancelled' };
    }
  };

  const handleConnectReadOnlyAddress = async (
    address: string,
    networkKind: 'evm' | 'solana'
  ): Promise<{ ok: boolean; message: string }> => {
    const rpcData = await fetchChainBalances(address, networkKind, '0x1');
    if (rpcData.error) {
      return { ok: false, message: rpcData.error };
    }
    setExternalWallets((prev) => [
      ...prev.filter((w) => w.address.toLowerCase() !== address.toLowerCase()),
      {
        provider: networkKind === 'solana' ? 'solana' : 'metamask',
        label: networkKind === 'solana' ? 'Solana Address' : 'EVM Address',
        address,
        chainIdHex: networkKind === 'evm' ? '0x1' : undefined,
        networkName: rpcData.networkName,
        connectedAt: new Date().toISOString().slice(0, 10),
        readOnly: true,
        balances: rpcData.balances,
      },
    ]);
    return {
      ok: true,
      message: lang === 'ar' ? 'تم جلب الرصيد الحقيقي من الشبكة بنجاح.' : 'Live public wallet balances fetched from RPC.',
    };
  };

  const handleRefreshExternalBalances = async (address: string) => {
    const existing = externalWallets.find((w) => w.address === address);
    if (!existing) return;
    const isSol = existing.provider === 'solana';
    const rpcData = await fetchChainBalances(address, isSol ? 'solana' : 'evm', existing.chainIdHex);
    setExternalWallets((prev) =>
      prev.map((w) =>
        w.address === address
          ? { ...w, networkName: rpcData.networkName, balances: rpcData.balances, balanceError: rpcData.error }
          : w
      )
    );
  };

  const handleDisconnectExternalWallet = (address: string) => {
    setExternalWallets((prev) => prev.filter((w) => w.address !== address));
  };

  const handleVerifyTxDeposit = async (
    txHash: string,
    currency: SupportedCurrency,
    amountUSD: number,
    chainIdHex?: string
  ): Promise<{ ok: boolean; message: string }> => {
    const res = await fetch('/api/wallet/verify-tx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ txHash, chainIdHex, amountUSD, currency, kind: 'deposit' }),
    });
    const json = await res.json();
    if (!res.ok) {
      return { ok: false, message: json.error || 'Verification failed' };
    }
    setTransactions((prev) => [json.transaction, ...prev]);
    if (Array.isArray(json.internalBalances)) setInternalBalances(json.internalBalances);
    return {
      ok: true,
      message: lang === 'ar' ? 'تم التحقق من المعاملة على البلوكشين وإضافة الرصيد.' : 'Transaction verified on-chain and credited.',
    };
  };

  const handleSubmitExternalWalletPayment = async (
    walletAddress: string,
    currency: 'ETH' | 'USDT' | 'USDC',
    recipientAddress: string,
    amountUSD: number,
    forCart: boolean
  ): Promise<{ ok: boolean; message: string }> => {
    const wallet = externalWallets.find((w) => w.address === walletAddress && !w.readOnly);
    const provider = wallet ? resolveEip1193Provider(wallet.provider) : null;
    if (!provider) {
      return { ok: false, message: 'Connected EVM signer not found.' };
    }

    try {
      const ethAmount = Math.max(0.00001, amountUSD / 3150);
      const wei = BigInt(Math.floor(ethAmount * 1e18));
      const txHash = (await provider.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: walletAddress,
            to: recipientAddress,
            value: `0x${wei.toString(16)}`,
          },
        ],
      })) as string;

      if (forCart && cart.length > 0) {
        const order: OrderRecord = {
          id: `ord-${Date.now()}`,
          referenceCode: `ST21-${Math.floor(10000 + Math.random() * 89999)}`,
          storeName: 'Store-21 Web3 Checkout',
          paymentSource: 'external_wallet',
          currency,
          totalUSD: amountUSD,
          items: cart.map((c) => ({
            productId: c.product.id,
            title: c.product.title,
            titleEn: c.product.titleEn,
            quantity: c.quantity,
            priceUSD: c.product.priceUSD,
          })),
          status: 'pending_backend_verification',
          txHash,
          timestamp: new Date().toISOString().slice(0, 10),
        };
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(order),
        });
        const data = await res.json();
        if (data.order) setOrders((prev) => [data.order, ...prev]);
        if (data.transaction) setTransactions((prev) => [data.transaction, ...prev]);
        setCart([]);
      }

      return {
        ok: true,
        message:
          lang === 'ar'
            ? `تم بث المعاملة: ${txHash.slice(0, 14)}...`
            : `Transaction submitted: ${txHash.slice(0, 14)}...`,
      };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : 'Transaction rejected in wallet.' };
    }
  };

  const handleSubmitCartOrderIntent = async (note: string): Promise<{ ok: boolean; message: string }> => {
    if (cart.length === 0) return { ok: false, message: 'Cart is empty.' };
    const totalUSD = cart.reduce((s, i) => s + i.product.priceUSD * i.quantity, 0);
    const order: OrderRecord = {
      id: `ord-${Date.now()}`,
      referenceCode: `ST21-${Math.floor(10000 + Math.random() * 89999)}`,
      storeName: 'Store-21 Channel Order',
      paymentSource: 'order_intent',
      currency: 'USD',
      totalUSD,
      items: cart.map((c) => ({
        productId: c.product.id,
        title: c.product.title,
        titleEn: c.product.titleEn,
        quantity: c.quantity,
        priceUSD: c.product.priceUSD,
      })),
      status: 'pending_backend_verification',
      timestamp: new Date().toISOString().slice(0, 10),
      customerNote: note || undefined,
    };
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, message: 'Unable to record order.' };
    if (data.order) setOrders((prev) => [data.order, ...prev]);
    if (data.transaction) setTransactions((prev) => [data.transaction, ...prev]);
    setCart([]);
    return {
      ok: true,
      message:
        lang === 'ar'
          ? `تم تسجيل الطلب ${order.referenceCode} بحالة بانتظار الدفع والتحقق.`
          : `Order ${order.referenceCode} created (pending payment verification).`,
    };
  };

  const handleWithdrawInternal = async (
    currency: SupportedCurrency,
    amount: number,
    destination: string
  ): Promise<{ ok: boolean; message: string }> => {
    const res = await fetch('/api/wallet/withdraw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currency, amount, destination }),
    });
    const json = await res.json();
    if (!res.ok) {
      return { ok: false, message: json.error || 'Withdrawal rejected' };
    }
    setTransactions((prev) => [json.transaction, ...prev]);
    if (Array.isArray(json.internalBalances)) setInternalBalances(json.internalBalances);
    return {
      ok: true,
      message: lang === 'ar' ? 'تم تسجيل طلب السحب بنجاح.' : 'Withdrawal request recorded.',
    };
  };

  // Channel & Post mutations
  const handleToggleFollow = async (channelId: string) => {
    const ch = channels.find((c) => c.id === channelId);
    if (!ch) return;
    const nextFollowed = !ch.isFollowed;
    const nextCount = ch.followersCount + (nextFollowed ? 1 : -1);
    setChannels((prev) =>
      prev.map((c) => (c.id === channelId ? { ...c, isFollowed: nextFollowed, followersCount: nextCount } : c))
    );
    await fetch(`/api/channels/${channelId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isFollowed: nextFollowed, followersCount: nextCount }),
    });
  };

  const handleToggleMute = async (channelId: string) => {
    const ch = channels.find((c) => c.id === channelId);
    if (!ch) return;
    const nextMuted = !ch.isMuted;
    setChannels((prev) => prev.map((c) => (c.id === channelId ? { ...c, isMuted: nextMuted } : c)));
    await fetch(`/api/channels/${channelId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isMuted: nextMuted }),
    });
  };

  const handleCreateChannel = async (name: string, category: string, description: string) => {
    const id = `ch-${Date.now()}`;
    const groupId = `thr-grp-${Date.now()}`;
    const newChannel: StoreChannel = {
      id,
      name,
      nameEn: name,
      handle: `@channel-${Date.now().toString().slice(-4)}`,
      ownerName: profile.name,
      ownerNameEn: profile.name,
      category,
      categoryEn: category,
      description: description || name,
      descriptionEn: description || name,
      avatarImage: PRODUCT_IMAGES.watch,
      bannerImage: PRODUCT_IMAGES.vault,
      verified: false,
      followersCount: 1,
      isFollowed: true,
      isMuted: false,
      linkedGroupId: groupId,
      linkedGroupEnabled: true,
      linkedGroupName: `مجموعة ${name}`,
      linkedGroupNameEn: `${name} Community`,
      connectedPlatforms: [],
      members: [
        {
          id: `mem-${Date.now()}`,
          name: profile.name,
          handle: profile.username,
          role: 'owner',
          muted: false,
          joinedAt: new Date().toISOString().slice(0, 10),
        },
      ],
    };
    const res = await fetch('/api/channels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newChannel),
    });
    const data = await res.json();
    if (res.ok) {
      setChannels((prev) => [newChannel, ...prev]);
      if (Array.isArray(data.threads)) setThreads(data.threads);
      setActiveChannelId(newChannel.id);
      showToast(lang === 'ar' ? 'تم إنشاء القناة وربط مجموعة النقاش.' : 'Channel and linked group created.');
    }
  };

  const handlePublishPost = async (post: ChannelPost) => {
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(post),
    });
    if (res.ok) {
      setPosts((prev) => [post, ...prev]);
      showToast(lang === 'ar' ? 'تم النشر في القناة.' : 'Published to channel.');
    }
  };

  const handlePublishProduct = async (product: Product) => {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product, createPost: true }),
    });
    const data = await res.json();
    if (res.ok) {
      setProducts((prev) => [product, ...prev]);
      if (data.post) setPosts((prev) => [data.post, ...prev]);
      showToast(lang === 'ar' ? 'تم نشر المنتج داخل القناة.' : 'Product published to channel.');
    }
  };

  const handleReactPost = async (postId: string, key: 'heart' | 'thumbs' | 'fire') => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, reactions: { ...p.reactions, [key]: p.reactions[key] + 1 } } : p))
    );
    await fetch(`/api/posts/${postId}/react`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    });
  };

  const handleAddComment = async (postId: string, text: string) => {
    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author: profile.name, text }),
    });
    const data = await res.json();
    if (res.ok && data.post) {
      setPosts((prev) => prev.map((p) => (p.id === postId ? data.post : p)));
    }
  };

  const handleSendLiveChat = async (postId: string, text: string) => {
    const res = await fetch(`/api/posts/${postId}/live-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender: profile.name, role: 'viewer', text }),
    });
    const data = await res.json();
    if (res.ok && data.post) {
      setPosts((prev) => prev.map((p) => (p.id === postId ? data.post : p)));
    }
  };

  const handleToggleLiveStatus = async (postId: string, liveActive: boolean, hasReplay: boolean) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, liveActive, hasReplay } : p))
    );
    const res = await fetch(`/api/posts/${postId}/live-status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ liveActive, hasReplay }),
    });
    const data = await res.json();
    if (res.ok && data.post) {
      setPosts((prev) => prev.map((p) => (p.id === postId ? data.post : p)));
      showToast(
        liveActive
          ? lang === 'ar'
            ? 'تم تفعيل البث المباشر في القناة.'
            : 'Channel live broadcast started.'
          : lang === 'ar'
          ? 'تم إنهاء البث وحفظ الإعادة في القناة.'
          : 'Broadcast ended and replay saved.'
      );
    }
  };

  const handleToggleMemberMute = async (channelId: string, memberId: string) => {
    const ch = channels.find((c) => c.id === channelId);
    if (!ch) return;
    const updatedMembers = ch.members.map((m) => (m.id === memberId ? { ...m, muted: !m.muted } : m));
    setChannels((prev) => prev.map((c) => (c.id === channelId ? { ...c, members: updatedMembers } : c)));
    await fetch(`/api/channels/${channelId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ members: updatedMembers }),
    });
  };

  const handleToggleLinkedGroup = async (channelId: string) => {
    const ch = channels.find((c) => c.id === channelId);
    if (!ch) return;
    const next = !ch.linkedGroupEnabled;
    setChannels((prev) => prev.map((c) => (c.id === channelId ? { ...c, linkedGroupEnabled: next } : c)));
    await fetch(`/api/channels/${channelId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ linkedGroupEnabled: next }),
    });
  };

  const handleSubmitProductReview = async (productId: string, rating: number, comment: string) => {
    const res = await fetch(`/api/products/${productId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author: profile.name, rating, comment }),
    });
    const data = await res.json();
    if (res.ok && data.product) {
      setProducts((prev) => prev.map((p) => (p.id === productId ? data.product : p)));
      showToast(lang === 'ar' ? 'تم نشر تقييمك على المنتج.' : 'Your product review has been posted.');
    }
  };

  // Unified Chats & Groups handlers
  const handleSelectChatThread = (threadId: string) => {
    setActiveChatId(threadId);
    setThreads((prev) => prev.map((t) => (t.id === threadId ? { ...t, unreadCount: 0 } : t)));
  };

  const handleContactSeller = async (channelId: string) => {
    const res = await fetch('/api/chats/ensure-direct', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channelId }),
    });
    const data = await res.json();
    if (res.ok && data.thread) {
      if (Array.isArray(data.threads)) setThreads(data.threads);
      setActiveChatId(data.thread.id);
      setSelectedProductModal(null);
      setActiveSection('chats');
    }
  };

  const handleSendMessage = async (payload: {
    threadId: string;
    text: string;
    attachedProductId?: string;
    replyTo?: ChatMessage['replyTo'];
    forwardedFrom?: string;
    media?: MessageMediaAttachment;
  }) => {
    const msg: ChatMessage = {
      id: `cm-${Date.now()}`,
      threadId: payload.threadId,
      authorName: profile.name,
      authorHandle: profile.username,
      authorRole: 'me',
      text: payload.text || (payload.attachedProductId && !payload.media ? (lang === 'ar' ? 'استفسار حول المنتج المرفق' : 'Product inquiry') : ''),
      timestamp: lang === 'ar' ? 'الآن' : 'Now',
      deliveryStatus: 'delivered',
      attachedProductId: payload.attachedProductId,
      replyTo: payload.replyTo,
      forwardedFrom: payload.forwardedFrom,
      media: payload.media,
      reactions: 0,
    };
    const res = await fetch('/api/chats/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(msg),
    });
    if (res.ok) {
      setMessages((prev) => [...prev, msg]);
    }
  };

  const handleEditMessage = async (msgId: string, nextText: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, text: nextText, edited: true } : m))
    );
    await fetch(`/api/chats/messages/${msgId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: nextText }),
    });
  };

  const handleDeleteMessage = async (msgId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
    await fetch(`/api/chats/messages/${msgId}`, { method: 'DELETE' });
  };

  const handleReactMessage = async (msgId: string) => {
    setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, reactions: m.reactions + 1 } : m)));
    await fetch(`/api/chats/messages/${msgId}/react`, { method: 'POST' });
  };

  const handleTogglePinMessage = async (msgId: string) => {
    setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, pinned: !m.pinned } : m)));
    await fetch(`/api/chats/messages/${msgId}/pin`, { method: 'POST' });
  };

  // Commerce integrations handlers
  const handleConnectIntegration = async (
    platform: PlatformId,
    payload: { storeUrl: string; token: string; consumerKey?: string; consumerSecret?: string; channelId: string }
  ): Promise<{ ok: boolean; error?: string }> => {
    const res = await fetch(`/api/integrations/${platform}/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.integration) {
      setIntegrations((prev) => prev.map((i) => (i.id === platform ? data.integration : i)));
    }
    if (!res.ok) {
      return { ok: false, error: data.error || 'Integration verification failed' };
    }
    if (Array.isArray(data.importedProducts)) setProducts((prev) => [...data.importedProducts, ...prev]);
    if (Array.isArray(data.createdPosts)) setPosts((prev) => [...data.createdPosts, ...prev]);
    if (Array.isArray(data.channels)) setChannels(data.channels);
    return { ok: true };
  };

  const handleSyncIntegration = async (platform: PlatformId): Promise<{ ok: boolean; error?: string }> => {
    const res = await fetch(`/api/integrations/${platform}/sync`, { method: 'POST' });
    const data = await res.json();
    if (data.integration) {
      setIntegrations((prev) => prev.map((i) => (i.id === platform ? data.integration : i)));
    }
    if (!res.ok) return { ok: false, error: data.error };
    return { ok: true };
  };

  const handleDisconnectIntegration = async (platform: PlatformId) => {
    const res = await fetch(`/api/integrations/${platform}/disconnect`, { method: 'POST' });
    const data = await res.json();
    if (data.integration) {
      setIntegrations((prev) => prev.map((i) => (i.id === platform ? data.integration : i)));
    }
  };

  const handleFetchIntegrationOrders = async (
    platform: PlatformId
  ): Promise<{ ok: boolean; orders?: SyncedStoreOrder[]; error?: string }> => {
    const res = await fetch(`/api/integrations/${platform}/orders`);
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error };
    return { ok: true, orders: data.orders || [] };
  };

  // Account mutations
  const handleSaveProfile = async (next: UserProfile) => {
    setProfile(next);
    await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next),
    });
    showToast(lang === 'ar' ? 'تم حفظ إعدادات الحساب.' : 'Account settings saved.');
  };

  const handleRevokeSession = async (sessionId: string) => {
    const res = await fetch(`/api/sessions/${sessionId}/revoke`, { method: 'POST' });
    const data = await res.json();
    if (res.ok && Array.isArray(data.sessions)) setSessions(data.sessions);
  };

  const handleSubmitSupport = async (subject: string, message: string) => {
    const res = await fetch('/api/support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, message }),
    });
    const data = await res.json();
    if (res.ok && data.ticket) setSupportTickets((prev) => [data.ticket, ...prev]);
  };

  // Cart actions
  const handleAddToCart = (product: Product, finish?: ProductFinish, qty = 1) => {
    const chosenFinish = finish || product.finish;
    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === product.id && c.selectedFinish === chosenFinish);
      if (existing) {
        return prev.map((c) =>
          c.product.id === product.id && c.selectedFinish === chosenFinish
            ? { ...c, quantity: c.quantity + qty }
            : c
        );
      }
      return [...prev, { product, quantity: qty, selectedFinish: chosenFinish }];
    });
    showToast(
      lang === 'ar'
        ? `تمت إضافة ${product.title} إلى السلة.`
        : `Added ${product.titleEn} to bag.`
    );
  };

  const handleUpdateCartQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => (c.product.id === productId ? { ...c, quantity: c.quantity + delta } : c))
        .filter((c) => c.quantity > 0)
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCart((prev) => prev.filter((c) => c.product.id !== productId));
  };

  if (loggedOut) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA] p-6 text-[#141518]">
        <div className="w-full max-w-md space-y-5 rounded-2xl border border-[#E5E7EB] bg-white p-8 text-center shadow-sm">
          <Store21Mark className="mx-auto h-12 w-12" />
          <h1 className="font-display text-xl font-extrabold">Store-21</h1>
          <p className="text-xs leading-relaxed text-[#4B5563]">
            {lang === 'ar'
              ? 'تم تسجيل الخروج من الجلسة الحالية بنجاح.'
              : 'You have been signed out of the current session.'}
          </p>
          <button
            type="button"
            onClick={() => {
              setLoggedOut(false);
              setActiveSection('home');
            }}
            className="w-full rounded-xl bg-[#059669] py-2.5 text-xs font-semibold text-white hover:bg-[#047857]"
          >
            {lang === 'ar' ? 'العودة وتسجيل الدخول' : 'Sign back in'}
          </button>
        </div>
      </div>
    );
  }

  const unreadChats = threads.reduce((sum, tr) => sum + tr.unreadCount, 0);
  const liveChannelsCount = posts.filter((p) => p.type === 'live' && p.liveActive !== false).length;
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const activeModalProduct = selectedProductModal
    ? products.find((p) => p.id === selectedProductModal.productId) || null
    : null;

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20 text-[#141518] md:pb-10">
      <TopBar
        lang={lang}
        onToggleLang={() => setLang((prev) => (prev === 'ar' ? 'en' : 'ar'))}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        cartCount={cartCount}
        unreadNotifications={unreadChats}
        profile={profile}
        onOpenCart={() => setCartOpen(true)}
        onNavigate={(sec) => {
          if (sec === 'profile') setProfileTab('account');
          setActiveSection(sec);
        }}
      />

      {toast && (
        <div className="fixed bottom-20 end-4 z-50 rounded-xl border border-[#A7F3D0] bg-[#141518] px-4 py-2.5 text-xs font-semibold text-white shadow-xl md:bottom-6">
          {toast}
        </div>
      )}

      <div className="mx-auto flex max-w-[1360px] items-start gap-6 px-4 py-6 sm:px-6">
        <DesktopSidebar
          lang={lang}
          activeSection={activeSection}
          unreadChats={unreadChats}
          liveChannelsCount={liveChannelsCount}
          onNavigate={setActiveSection}
        />

        <main className="min-w-0 flex-1">
          {activeSection === 'home' && (
            <HomePage
              lang={lang}
              channels={channels}
              posts={posts}
              products={products}
              searchQuery={searchQuery}
              onOpenChannel={(chId) => {
                setActiveChannelId(chId);
                setActiveSection('channels');
              }}
              onToggleFollow={handleToggleFollow}
              onOpenProduct={(prod, mode = 'images') =>
                setSelectedProductModal({ productId: prod.id, mode })
              }
              onAddToCart={(prod) => handleAddToCart(prod)}
              onReactPost={handleReactPost}
              onNavigateChannels={() => setActiveSection('channels')}
            />
          )}

          {activeSection === 'chats' && (
            <ChatsPage
              lang={lang}
              threads={threads}
              messages={messages}
              products={products}
              channels={channels}
              activeThreadId={activeChatId}
              onSelectThread={handleSelectChatThread}
              onSendMessage={handleSendMessage}
              onEditMessage={handleEditMessage}
              onDeleteMessage={handleDeleteMessage}
              onReactMessage={handleReactMessage}
              onTogglePin={handleTogglePinMessage}
              onOpenProduct={(prod) =>
                setSelectedProductModal({ productId: prod.id, mode: 'images' })
              }
              onOpenChannel={(chId) => {
                setActiveChannelId(chId);
                setActiveSection('channels');
              }}
            />
          )}

          {activeSection === 'channels' && (
            <ChannelsPage
              lang={lang}
              channels={channels}
              activeChannelId={activeChannelId}
              onSelectChannel={setActiveChannelId}
              posts={posts}
              products={products}
              integrations={integrations}
              onToggleFollow={handleToggleFollow}
              onToggleMute={handleToggleMute}
              onCreateChannel={handleCreateChannel}
              onPublishPost={handlePublishPost}
              onPublishProduct={handlePublishProduct}
              onOpenProduct={(prod, mode = 'images') =>
                setSelectedProductModal({ productId: prod.id, mode })
              }
              onAddToCart={(prod) => handleAddToCart(prod)}
              onReactPost={handleReactPost}
              onAddComment={handleAddComment}
              onSendLiveChat={handleSendLiveChat}
              onToggleLiveStatus={handleToggleLiveStatus}
              onOpenLinkedGroup={(groupId) => {
                handleSelectChatThread(groupId);
                setActiveSection('chats');
              }}
              onContactOwner={handleContactSeller}
              onToggleMemberMute={handleToggleMemberMute}
              onToggleLinkedGroup={handleToggleLinkedGroup}
              onConnectIntegration={handleConnectIntegration}
              onSyncIntegration={handleSyncIntegration}
              onDisconnectIntegration={handleDisconnectIntegration}
              onFetchIntegrationOrders={handleFetchIntegrationOrders}
            />
          )}

          {activeSection === 'profile' && (
            <ProfilePage
              lang={lang}
              activeTab={profileTab}
              onChangeTab={setProfileTab}
              onChangeLang={setLang}
              profile={profile}
              sessions={sessions}
              supportTickets={supportTickets}
              integrations={integrations}
              channels={channels}
              internalBalances={internalBalances}
              externalWallets={externalWallets}
              transactions={transactions}
              orders={orders}
              cart={cart}
              walletConnectConfigured={Boolean(walletConnectProjectId)}
              onSaveProfile={handleSaveProfile}
              onRevokeSession={handleRevokeSession}
              onSubmitSupport={handleSubmitSupport}
              onLogout={() => setLoggedOut(true)}
              onOpenChannel={(chId) => {
                setActiveChannelId(chId);
                setActiveSection('channels');
              }}
              onConnectProvider={handleConnectProvider}
              onConnectReadOnlyAddress={handleConnectReadOnlyAddress}
              onRefreshExternalBalances={handleRefreshExternalBalances}
              onDisconnectExternalWallet={handleDisconnectExternalWallet}
              onVerifyTxDeposit={handleVerifyTxDeposit}
              onSubmitExternalWalletPayment={handleSubmitExternalWalletPayment}
              onSubmitCartOrderIntent={handleSubmitCartOrderIntent}
              onWithdrawInternal={handleWithdrawInternal}
              onRemoveCartItem={handleRemoveCartItem}
              onConnectIntegration={handleConnectIntegration}
              onSyncIntegration={handleSyncIntegration}
              onDisconnectIntegration={handleDisconnectIntegration}
              onFetchIntegrationOrders={handleFetchIntegrationOrders}
            />
          )}
        </main>
      </div>

      <MobileBottomNav
        lang={lang}
        activeSection={activeSection}
        unreadChats={unreadChats}
        liveChannelsCount={liveChannelsCount}
        onNavigate={setActiveSection}
      />

      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        lang={lang}
        cart={cart}
        onUpdateQty={handleUpdateCartQty}
        onRemoveItem={handleRemoveCartItem}
        onProceedToWallet={() => {
          setProfileTab('wallet');
          setActiveSection('profile');
        }}
      />

      {activeModalProduct && selectedProductModal && (
        <ProductDetailModal
          lang={lang}
          product={activeModalProduct}
          channel={channels.find((c) => c.id === activeModalProduct.channelId)}
          initialMode={selectedProductModal.mode}
          onClose={() => setSelectedProductModal(null)}
          onAddToCart={handleAddToCart}
          onOrderNow={(prod, finish, qty) => {
            handleAddToCart(prod, finish, qty);
            setSelectedProductModal(null);
            setProfileTab('wallet');
            setActiveSection('profile');
          }}
          onContactSeller={handleContactSeller}
          onOpenChannel={(chId) => {
            setSelectedProductModal(null);
            setActiveChannelId(chId);
            setActiveSection('channels');
          }}
          onSubmitReview={handleSubmitProductReview}
        />
      )}
    </div>
  );
}
