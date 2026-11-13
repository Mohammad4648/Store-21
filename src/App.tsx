import { useEffect, useState } from 'react';
import { Clapperboard, Link2, Send, ShoppingBag, Wallet } from 'lucide-react';
import { BlockchainWalletDrawer } from './components/BlockchainWalletDrawer';
import { PlatformIntegrationsSection } from './components/PlatformIntegrationsSection';
import { Scene3DShowcase } from './components/Scene3DShowcase';
import { ShopifyCatalogView } from './components/ShopifyCatalogView';
import { TelegramChannelsHub } from './components/TelegramChannelsHub';
import { TelegramSidebarRail } from './components/TelegramSidebarRail';
import { TikTokLivePlayer } from './components/TikTokLivePlayer';
import { TopNav } from './components/TopNav';
import {
  INITIAL_CHANNEL_POSTS,
  INITIAL_CHANNELS,
  INITIAL_GROUP_MESSAGES,
  INITIAL_INTEGRATIONS,
  INITIAL_LIVE_STREAMS,
  INITIAL_PRODUCTS,
} from './data/initialData';
import {
  ActiveSection,
  BlockchainNetwork,
  CartItem,
  ChannelPost,
  CryptoCurrency,
  GroupMessage,
  LiveStreamState,
  OnChainOrder,
  PlatformIntegration,
  Product,
  ProductFinish,
  StoreChannel,
  WalletState,
} from './types/commerce';

const VALID_VIEWS: ActiveSection[] = ['showcase', 'channels', 'live', 'products', 'integrations'];

function getInitialView(): ActiveSection {
  const hash = window.location.hash.replace('#', '') as ActiveSection;
  return VALID_VIEWS.includes(hash) ? hash : 'showcase';
}

export default function App() {
  const [activeView, setActiveView] = useState<ActiveSection>(getInitialView);
  const [searchQuery, setSearchQuery] = useState('');

  const [channels, setChannels] = useState<StoreChannel[]>(INITIAL_CHANNELS);
  const [activeChannelId, setActiveChannelId] = useState<string>(INITIAL_CHANNELS[0].id);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [selectedProductId, setSelectedProductId] = useState<string>(INITIAL_PRODUCTS[0].id);
  const [selectedFinish, setSelectedFinish] = useState<ProductFinish>(INITIAL_PRODUCTS[0].finish);

  const [posts, setPosts] = useState<ChannelPost[]>(INITIAL_CHANNEL_POSTS);
  const [groupMessages, setGroupMessages] = useState<GroupMessage[]>(INITIAL_GROUP_MESSAGES);
  const [liveStreams, setLiveStreams] = useState<LiveStreamState[]>(INITIAL_LIVE_STREAMS);
  const [activeLiveIndex, setActiveLiveIndex] = useState<number>(0);
  const [integrations, setIntegrations] = useState<PlatformIntegration[]>(INITIAL_INTEGRATIONS);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeDiscountPercent, setActiveDiscountPercent] = useState(0);
  const [orders, setOrders] = useState<OnChainOrder[]>([]);
  const [toastMsg, setToastMsg] = useState('');

  const [wallet, setWallet] = useState<WalletState>({
    connected: false,
    address: '',
    network: 'polygon',
    isRealProvider: false,
    balances: {
      USDC: 8500,
      USDT: 4200,
      ETH: 2.45,
      SOL: 28.5,
    },
  });

  useEffect(() => {
    const onHashChange = () => {
      const next = window.location.hash.replace('#', '') as ActiveSection;
      if (VALID_VIEWS.includes(next)) {
        setActiveView(next);
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigateToView = (view: ActiveSection) => {
    setActiveView(view);
    if (window.location.hash !== `#${view}`) {
      window.history.pushState(null, '', `#${view}`);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === '1') navigateToView('showcase');
      else if (e.key === '2') navigateToView('channels');
      else if (e.key === '3') navigateToView('live');
      else if (e.key === '4') navigateToView('products');
      else if (e.key === '5') navigateToView('integrations');
      else if (e.key.toLowerCase() === 'w') setDrawerOpen((prev) => !prev);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const activeChannel = channels.find((c) => c.id === activeChannelId) || channels[0];
  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalUnread = channels.reduce((sum, c) => sum + c.unreadCount, 0);
  const liveCount = liveStreams.filter((s) => s.isLive).length;
  const connectedPlatformsCount = integrations.filter((i) => i.status === 'connected').length;

  const currentLiveStream = liveStreams[activeLiveIndex] || liveStreams[0];
  const currentLiveChannel =
    channels.find((c) => c.id === currentLiveStream?.channelId) || activeChannel;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => {
      setToastMsg((curr) => (curr === msg ? '' : curr));
    }, 3500);
  };

  const handleSelectChannel = (channelId: string) => {
    setActiveChannelId(channelId);
    setChannels((prev) =>
      prev.map((c) => (c.id === channelId ? { ...c, unreadCount: 0 } : c))
    );
  };

  const handleConnectDemoWallet = () => {
    setWallet((prev) => ({
      ...prev,
      connected: true,
      address: '0x71C94E22bA8D190C8F41E22091A30D8B120F9A4B',
      isRealProvider: false,
    }));
    showToast('تم ربط محفظة البلوكتشين التجريبية بنجاح.');
  };

  const handleConnectRealWallet = async () => {
    if (!window.ethereum) {
      handleConnectDemoWallet();
      showToast('لم يتم العثور على MetaMask؛ تم تفعيل المحفظة التجريبية الفورية.');
      return;
    }
    try {
      const accounts = (await window.ethereum.request({
        method: 'eth_requestAccounts',
      })) as string[];
      if (accounts && accounts[0]) {
        setWallet((prev) => ({
          ...prev,
          connected: true,
          address: accounts[0],
          isRealProvider: true,
        }));
        showToast('تم ربط محفظتك الحقيقية بنجاح.');
      }
    } catch {
      showToast('تم إلغاء طلب الاتصال بالمحفظة.');
    }
  };

  const handleDisconnectWallet = () => {
    setWallet((prev) => ({
      ...prev,
      connected: false,
      address: '',
      isRealProvider: false,
    }));
  };

  const handleChangeNetwork = (network: BlockchainNetwork) => {
    setWallet((prev) => ({ ...prev, network }));
  };

  const handleInspectIn3D = (product: Product) => {
    setSelectedProductId(product.id);
    setSelectedFinish(product.finish);
    navigateToView('showcase');
  };

  const handleAddToCart = (product: Product, finish: ProductFinish) => {
    setCart((prev) => {
      const existing = prev.find(
        (i) => i.product.id === product.id && i.selectedFinish === finish
      );
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id && i.selectedFinish === finish
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { product, quantity: 1, selectedFinish: finish }];
    });
    setActiveDiscountPercent(0);
    showToast(`تمت إضافة "${product.title}" إلى سلة البلوك تشين.`);
  };

  const handleInstantBuy = (
    product: Product,
    finish: ProductFinish,
    discountPercent = 0
  ) => {
    setCart([{ product, quantity: 1, selectedFinish: finish }]);
    setActiveDiscountPercent(discountPercent);
    if (!wallet.connected) {
      handleConnectDemoWallet();
    }
    setDrawerOpen(true);
  };

  const handleUpdateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleCheckoutSuccess = (
    currency: CryptoCurrency,
    amountCrypto: number,
    amountUSDC: number,
    txHash: string,
    blockNumber: number
  ) => {
    setWallet((prev) => ({
      ...prev,
      balances: {
        ...prev.balances,
        [currency]: Math.max(0, prev.balances[currency] - amountCrypto),
      },
    }));

    setProducts((prev) =>
      prev.map((prod) => {
        const bought = cart.find((c) => c.product.id === prod.id);
        if (!bought) return prod;
        return { ...prod, stock: Math.max(0, prod.stock - bought.quantity) };
      })
    );

    const newOrder: OnChainOrder = {
      id: `ord-${Date.now()}`,
      txHash,
      network: wallet.network,
      currency,
      amountCrypto,
      amountUSDC,
      items: cart.map((c) => ({
        title: c.product.title,
        quantity: c.quantity,
        priceUSDC: c.product.priceUSDC,
      })),
      escrowStatus: 'مؤمن بالعقد الذكي',
      blockNumber,
      timestamp: 'الآن',
      channelName: activeChannel.name,
    };

    setOrders((prev) => [newOrder, ...prev]);
    setCart([]);
    setActiveDiscountPercent(0);
  };

  const handleCreateChannel = (channel: StoreChannel) => {
    setChannels((prev) => [channel, ...prev]);
    setPosts((prev) => [
      {
        id: `cp-init-${Date.now()}`,
        channelId: channel.id,
        text: `مرحباً بكم في قناة ${channel.name}! يمكنكم الآن استعراض المنتجات ثلاثياً والدفع بالبلوك تشين.`,
        productId: products[0]?.id,
        timestamp: 'الآن',
        viewsCount: 1,
        likesCount: 1,
      },
      ...prev,
    ]);
    setGroupMessages((prev) => [
      {
        id: `gm-welcome-${Date.now()}`,
        channelId: channel.id,
        authorName: channel.ownerName,
        authorRole: 'merchant',
        text: `مرحباً بكم في ${channel.groupName}! هنا نجيب عن استفساراتكم ونشارك عروض البث المباشر.`,
        timestamp: 'الآن',
        reactions: 1,
        pinned: true,
      },
      ...prev,
    ]);
    setLiveStreams((prev) => [
      ...prev,
      {
        id: `live-${channel.id}`,
        channelId: channel.id,
        title: `بث ترحيبي مباشر: ${channel.name}`,
        hostName: channel.ownerName,
        isLive: false,
        viewerCount: 1,
        likesCount: 0,
        pinnedProductId: products[0]?.id || '',
        flashDiscountPercent: 10,
        useWebcam: false,
        startedAt: 'جاهز للبث',
        chatMessages: [
          {
            id: `lc-init-${Date.now()}`,
            sender: channel.ownerName,
            role: 'merchant',
            text: 'أهلاً بكم في أول بث تيك توك داخل القناة!',
            timestamp: 'الآن',
          },
        ],
      },
    ]);
    showToast(`تم إنشاء قناة "${channel.name}" وكروب العملاء وبث تيك توك الخاص بها.`);
  };

  const handlePublishPost = (post: ChannelPost) => {
    setPosts((prev) => [post, ...prev]);
    showToast('تم نشر المنشور في القناة.');
  };

  const handleLikePost = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, likesCount: p.likesCount + 1 } : p))
    );
  };

  const handleSendGroupMessage = (msg: GroupMessage) => {
    setGroupMessages((prev) => [...prev, msg]);
  };

  const handleReactGroupMessage = (msgId: string) => {
    setGroupMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, reactions: m.reactions + 1 } : m))
    );
  };

  const handleTogglePinMessage = (msgId: string) => {
    setGroupMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, pinned: !m.pinned } : m))
    );
  };

  const handleUpdateLiveStream = (updated: LiveStreamState) => {
    setLiveStreams((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  const handleAddProduct = (product: Product) => {
    setProducts((prev) => [product, ...prev]);
    showToast(`تمت إضافة "${product.title}" إلى الكتالوج.`);
  };

  const handleUpdateIntegration = (updated: PlatformIntegration) => {
    setIntegrations((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F6F6F7] text-[#202223]">
      <TopNav
        activeView={activeView}
        onSelectView={navigateToView}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        wallet={wallet}
        cartCount={cartCount}
        onOpenWalletDrawer={() => setDrawerOpen(true)}
      />

      {toastMsg && (
        <div className="fixed bottom-5 left-5 z-50 rounded-xl border border-[#C7E6DC] bg-[#1A1A1A] px-4 py-3 text-xs font-medium text-white shadow-xl">
          {toastMsg}
        </div>
      )}

      <div className="flex flex-1 flex-col md:flex-row">
        <TelegramSidebarRail
          activeView={activeView}
          onSelectView={navigateToView}
          totalUnread={totalUnread}
          liveCount={liveCount}
          onOpenWallet={() => setDrawerOpen(true)}
        />

        <main className="min-w-0 flex-1 bg-[#F6F6F7]">
          {activeView === 'showcase' && (
            <>
              <Scene3DShowcase
                product={selectedProduct}
                allProducts={products}
                onSelectProduct={(p) => setSelectedProductId(p.id)}
                selectedFinish={selectedFinish}
                onSelectFinish={setSelectedFinish}
                onAddToCart={handleAddToCart}
                onInstantBuy={(p, f) => handleInstantBuy(p, f, 0)}
              />

              {/* Clean Shopify Admin Quick Workspace Shortcuts */}
              <section className="mx-auto max-w-[1440px] px-4 pb-10 sm:px-8">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <button
                    type="button"
                    onClick={() => navigateToView('channels')}
                    className="flex items-start gap-3.5 rounded-2xl border border-[#E1E3E5] bg-white p-5 text-start shadow-xs transition-colors hover:border-[#008060]"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EBF5F2] text-[#008060]">
                      <Send className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-display text-sm font-bold text-[#202223]">
                        قنوات وكروبات تلغرام
                      </div>
                      <div className="mt-1 text-xs text-[#6D7175]">
                        {channels.length} قنوات متاجر نشطة مع كروبات عملاء
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigateToView('live')}
                    className="flex items-start gap-3.5 rounded-2xl border border-[#E1E3E5] bg-white p-5 text-start shadow-xs transition-colors hover:border-[#008060]"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF0F3] text-[#FE2C55]">
                      <Clapperboard className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-display text-sm font-bold text-[#202223]">
                        بث تيك توك التجاري
                      </div>
                      <div className="mt-1 text-xs text-[#6D7175]">
                        {liveCount} بث مباشر شغال الآن داخل القنوات
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigateToView('products')}
                    className="flex items-start gap-3.5 rounded-2xl border border-[#E1E3E5] bg-white p-5 text-start shadow-xs transition-colors hover:border-[#008060]"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F1F2F4] text-[#202223]">
                      <ShoppingBag className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-display text-sm font-bold text-[#202223]">
                        كتالوج المنتجات
                      </div>
                      <div className="mt-1 text-xs text-[#6D7175]">
                        {products.length} منتج جاهز للشراء بالبلوك تشين
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigateToView('integrations')}
                    className="flex items-start gap-3.5 rounded-2xl border border-[#E1E3E5] bg-white p-5 text-start shadow-xs transition-colors hover:border-[#008060]"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EBF5F2] text-[#008060]">
                      <Link2 className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-display text-sm font-bold text-[#202223]">
                        ربط المتاجر الشهيرة
                      </div>
                      <div className="mt-1 text-xs text-[#6D7175]">
                        {connectedPlatformsCount} منصات متصلة (سلة، زد، Shopify)
                      </div>
                    </div>
                  </button>
                </div>
              </section>
            </>
          )}

          {activeView === 'channels' && (
            <TelegramChannelsHub
              channels={channels}
              activeChannelId={activeChannel.id}
              onSelectChannel={handleSelectChannel}
              products={products}
              posts={posts}
              onPublishPost={handlePublishPost}
              onLikePost={handleLikePost}
              groupMessages={groupMessages}
              onSendGroupMessage={handleSendGroupMessage}
              onReactGroupMessage={handleReactGroupMessage}
              onTogglePinMessage={handleTogglePinMessage}
              liveStreams={liveStreams}
              onUpdateLiveStream={handleUpdateLiveStream}
              onCreateChannel={handleCreateChannel}
              onInspectIn3D={handleInspectIn3D}
              onAddToCart={handleAddToCart}
              onInstantBuy={handleInstantBuy}
            />
          )}

          {activeView === 'live' && currentLiveStream && (
            <section className="mx-auto max-w-[1440px] p-4 sm:p-8">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[#E1E3E5] pb-4">
                <div>
                  <h2 className="font-display text-2xl font-bold text-[#202223]">
                    خلاصة بثوث تيك توك التجارية
                  </h2>
                  <p className="text-xs text-[#6D7175]">
                    تنقل بين بثوث القنوات المباشرة واشترِ المنتجات المثبتة فوراً بالبلوك تشين
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleSelectChannel(currentLiveChannel.id);
                    navigateToView('channels');
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#C9CCCF] bg-white px-4 py-2 text-xs font-bold text-[#202223] hover:bg-[#FAFBFB]"
                >
                  <Send className="h-3.5 w-3.5 text-[#008060]" />
                  <span>فتح قناة {currentLiveChannel.name}</span>
                </button>
              </div>

              <TikTokLivePlayer
                stream={currentLiveStream}
                channel={currentLiveChannel}
                products={products}
                onUpdateStream={handleUpdateLiveStream}
                onInspectIn3D={handleInspectIn3D}
                onInstantBuy={handleInstantBuy}
                onPrevStream={() =>
                  setActiveLiveIndex((prev) => (prev - 1 + liveStreams.length) % liveStreams.length)
                }
                onNextStream={() =>
                  setActiveLiveIndex((prev) => (prev + 1) % liveStreams.length)
                }
                streamIndexLabel={`${activeLiveIndex + 1}/${liveStreams.length}`}
              />
            </section>
          )}

          {activeView === 'products' && (
            <ShopifyCatalogView
              channels={channels}
              activeChannel={activeChannel}
              products={products}
              searchQuery={searchQuery}
              onInspectIn3D={handleInspectIn3D}
              onAddToCart={handleAddToCart}
              onInstantBuy={(p, f) => handleInstantBuy(p, f, 0)}
              onAddProduct={handleAddProduct}
            />
          )}

          {activeView === 'integrations' && (
            <PlatformIntegrationsSection
              integrations={integrations}
              activeChannel={activeChannel}
              onUpdateIntegration={handleUpdateIntegration}
              onImportSyncedProduct={handleAddProduct}
            />
          )}

          <footer className="border-t border-[#E1E3E5] bg-white py-6">
            <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-4 px-4 text-xs text-[#6D7175] sm:flex-row sm:px-8">
              <div className="font-display text-sm font-bold text-[#202223]">
                سوق تشين — منصة التجارة بالبلوك تشين
              </div>
              <div className="flex flex-wrap items-center gap-5">
                <button type="button" onClick={() => navigateToView('showcase')} className="hover:text-[#008060]">
                  العرض 3D
                </button>
                <button type="button" onClick={() => navigateToView('channels')} className="hover:text-[#008060]">
                  قنوات تلغرام
                </button>
                <button type="button" onClick={() => navigateToView('live')} className="hover:text-[#008060]">
                  بثوث تيك توك
                </button>
                <button type="button" onClick={() => navigateToView('products')} className="hover:text-[#008060]">
                  المنتجات
                </button>
                <button type="button" onClick={() => navigateToView('integrations')} className="hover:text-[#008060]">
                  ربط المتاجر
                </button>
                <button type="button" onClick={() => setDrawerOpen(true)} className="inline-flex items-center gap-1 font-semibold text-[#008060]">
                  <Wallet className="h-3.5 w-3.5" />
                  <span>المحفظة</span>
                </button>
              </div>
              <div>© 2026 سوق تشين</div>
            </div>
          </footer>
        </main>
      </div>

      <BlockchainWalletDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        wallet={wallet}
        onConnectRealWallet={handleConnectRealWallet}
        onConnectDemoWallet={handleConnectDemoWallet}
        onDisconnectWallet={handleDisconnectWallet}
        onChangeNetwork={handleChangeNetwork}
        cart={cart}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveItem}
        onCheckoutSuccess={handleCheckoutSuccess}
        orders={orders}
        activeDiscountPercent={activeDiscountPercent}
      />
    </div>
  );
}
