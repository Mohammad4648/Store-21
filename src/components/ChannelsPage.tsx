import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bell,
  BellOff,
  Blocks,
  Box,
  CheckCircle2,
  ExternalLink,
  Image as ImageIcon,
  Info,
  Lock,
  MessageCircle,
  MoreHorizontal,
  Pin,
  Plus,
  Radio,
  Search,
  Send,
  Shield,
  ShoppingBag,
  Upload,
  UserPlus,
  Users,
  Video,
  VolumeX,
  X,
} from 'lucide-react';
import { PRODUCT_IMAGES } from '../data/initialData';
import { UI_COPY } from '../i18n/translations';
import {
  ChannelPost,
  ChannelPostType,
  ChatThread,
  Language,
  PlatformId,
  PlatformIntegration,
  Product,
  Product3DModelType,
  ProductMediaMode,
  StoreChannel,
  SyncedStoreOrder,
} from '../types/commerce';
import {
  isChannelAdmin,
  normalizeHandle,
  sortChannelPostsPinnedFirst,
} from '../utils/commerceLogic';
import { ChannelPostCard } from './ChannelPostCard';
import { CommerceIntegrationsPanel } from './CommerceIntegrationsPanel';
import { EcommerceProductCard } from './EcommerceProductCard';

interface ChannelsPageProps {
  lang: Language;
  userHandle: string;
  userName: string;
  channels: StoreChannel[];
  activeChannelId: string;
  onSelectChannel: (channelId: string) => void;
  posts: ChannelPost[];
  products: Product[];
  threads: ChatThread[];
  integrations: PlatformIntegration[];
  onToggleFollow: (channelId: string) => void;
  onToggleMute: (channelId: string) => void;
  onCreateChannel: (name: string, category: string, description: string) => Promise<void>;
  onPublishPost: (post: ChannelPost) => Promise<boolean>;
  onPublishProduct: (product: Product) => Promise<boolean>;
  onPinPost: (postId: string) => void;
  onVotePoll: (postId: string, optionId: string) => void;
  onForwardPost: (post: ChannelPost, targetThreadId: string) => void;
  onOpenProduct: (product: Product, mode?: 'images' | 'video' | '3d') => void;
  onAddToCart: (product: Product) => void;
  onReactPost: (postId: string, key: 'heart' | 'thumbs' | 'fire') => void;
  onAddComment: (postId: string, text: string) => void;
  onSendLiveChat: (postId: string, text: string) => void;
  onToggleLiveStatus: (postId: string, liveActive: boolean, hasReplay: boolean) => void;
  onOpenLinkedGroup: (groupId: string, channelId?: string) => void;
  onContactOwner: (channelId: string) => void;
  onUpdateMemberRole: (
    channelId: string,
    memberId: string,
    patch: { role?: 'moderator' | 'member'; muted?: boolean; canPost?: boolean }
  ) => Promise<void>;
  onAddMember: (
    channelId: string,
    payload: { name: string; handle: string; role: 'moderator' | 'member' }
  ) => Promise<boolean>;
  onToggleLinkedGroup: (channelId: string) => void;
  onConnectIntegration: (
    platform: PlatformId,
    payload: {
      storeUrl: string;
      token: string;
      consumerKey?: string;
      consumerSecret?: string;
      channelId: string;
    }
  ) => Promise<{ ok: boolean; error?: string }>;
  onSyncIntegration: (platform: PlatformId) => Promise<{ ok: boolean; error?: string }>;
  onDisconnectIntegration: (platform: PlatformId) => Promise<void>;
  onFetchIntegrationOrders: (
    platform: PlatformId
  ) => Promise<{ ok: boolean; orders?: SyncedStoreOrder[]; error?: string }>;
}

type ChannelTab = 'posts' | 'products' | 'live' | 'groups';

export const ChannelsPage: React.FC<ChannelsPageProps> = ({
  lang,
  userHandle,
  userName,
  channels,
  activeChannelId,
  onSelectChannel,
  posts,
  products,
  threads,
  integrations,
  onToggleFollow,
  onToggleMute,
  onCreateChannel,
  onPublishPost,
  onPublishProduct,
  onPinPost,
  onVotePoll,
  onForwardPost,
  onOpenProduct,
  onAddToCart,
  onReactPost,
  onAddComment,
  onSendLiveChat,
  onToggleLiveStatus,
  onOpenLinkedGroup,
  onContactOwner,
  onUpdateMemberRole,
  onAddMember,
  onToggleLinkedGroup,
  onConnectIntegration,
  onSyncIntegration,
  onDisconnectIntegration,
  onFetchIntegrationOrders,
}) => {
  const t = UI_COPY[lang];
  const BackIcon = lang === 'ar' ? ArrowRight : ArrowLeft;
  const [channelSearch, setChannelSearch] = useState('');
  const [inChannelSearch, setInChannelSearch] = useState('');
  const [activeTab, setActiveTab] = useState<ChannelTab>('posts');
  const [mobileShowChannel, setMobileShowChannel] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Channel Info & management dialogs
  const [channelInfoOpen, setChannelInfoOpen] = useState(false);
  const [createChannelOpen, setCreateChannelOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [integrationsOpen, setIntegrationsOpen] = useState(false);

  // Create Channel State
  const [newChName, setNewChName] = useState('');
  const [newChCat, setNewChCat] = useState('');
  const [newChDesc, setNewChDesc] = useState('');

  // Quick Inline Admin Compose State
  const [quickText, setQuickText] = useState('');

  // Add Member State
  const [newMemName, setNewMemName] = useState('');
  const [newMemHandle, setNewMemHandle] = useState('');
  const [newMemRole, setNewMemRole] = useState<'moderator' | 'member'>('moderator');

  // Upgraded Publish Modal State
  const [postType, setPostType] = useState<ChannelPostType>('announcement');
  const [postText, setPostText] = useState('');
  const [postVideoUrl, setPostVideoUrl] = useState('');
  const [postImageUrl, setPostImageUrl] = useState('');
  const [attachedProductId, setAttachedProductId] = useState('');
  const [pinOnPublish, setPinOnPublish] = useState(false);
  const [allowCommentsOnPublish, setAllowCommentsOnPublish] = useState(true);
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);

  // Product Publish State
  const [prodTitle, setProdTitle] = useState('');
  const [prodPrice, setProdPrice] = useState('129');
  const [prodStock, setProdStock] = useState('15');
  const [prodMediaMode, setProdMediaMode] = useState<ProductMediaMode>('images');
  const [prodImageUrl, setProdImageUrl] = useState(PRODUCT_IMAGES.watch);
  const [prodVideoUrl, setProdVideoUrl] = useState('');
  const [prod3dType, setProd3dType] = useState<Product3DModelType>('watch');
  const [prodGlbUrl, setProdGlbUrl] = useState('');
  const [liveTitle, setLiveTitle] = useState('');

  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const prodUploadInputRef = useRef<HTMLInputElement | null>(null);

  const activeChannel = channels.find((c) => c.id === activeChannelId) || channels[0];
  const userIsAdmin = isChannelAdmin(activeChannel, userHandle);

  const filteredChannels = useMemo(() => {
    const q = channelSearch.trim().toLowerCase();
    if (!q) return channels;
    return channels.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.nameEn.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.categoryEn.toLowerCase().includes(q)
    );
  }, [channels, channelSearch]);

  const channelPostsOnly = useMemo(() => {
    if (!activeChannel) return [];
    const q = inChannelSearch.trim().toLowerCase();
    const list = posts.filter((p) => {
      if (p.channelId !== activeChannel.id || p.type === 'live') return false;
      if (!q) return true;
      return p.text.toLowerCase().includes(q) || p.textEn.toLowerCase().includes(q);
    });
    return sortChannelPostsPinnedFirst(list);
  }, [posts, activeChannel, inChannelSearch]);

  const channelProducts = useMemo(() => {
    if (!activeChannel) return [];
    const q = inChannelSearch.trim().toLowerCase();
    return products.filter((pr) => {
      if (pr.channelId !== activeChannel.id) return false;
      if (!q) return true;
      return (
        pr.title.toLowerCase().includes(q) ||
        pr.titleEn.toLowerCase().includes(q) ||
        pr.category.toLowerCase().includes(q)
      );
    });
  }, [products, activeChannel, inChannelSearch]);

  const channelLives = useMemo(() => {
    if (!activeChannel) return [];
    const q = inChannelSearch.trim().toLowerCase();
    return posts.filter((p) => {
      if (p.channelId !== activeChannel.id || p.type !== 'live') return false;
      if (!q) return true;
      return (
        (p.liveTitle || '').toLowerCase().includes(q) ||
        (p.liveTitleEn || '').toLowerCase().includes(q)
      );
    });
  }, [posts, activeChannel, inChannelSearch]);

  const handleLocalImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setter(reader.result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleQuickPublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChannel || !userIsAdmin || !quickText.trim()) return;
    const ok = await onPublishPost({
      id: `post-ann-${Date.now()}`,
      channelId: activeChannel.id,
      type: 'announcement',
      authorName: userName,
      authorHandle: userHandle,
      text: quickText.trim(),
      textEn: quickText.trim(),
      allowComments: true,
      timestamp: lang === 'ar' ? 'الآن' : 'Now',
      viewsCount: 1,
      reactions: { heart: 0, thumbs: 0, fire: 0 },
      comments: [],
    });
    if (ok) {
      setQuickText('');
      setActiveTab('posts');
    }
  };

  const handlePublishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChannel || !userIsAdmin) return;

    if (postType === 'product') {
      const prodId = `prod-${Date.now()}`;
      const has3D = prodMediaMode === 'model3d';
      const newProd: Product = {
        id: prodId,
        channelId: activeChannel.id,
        title: prodTitle.trim() || (lang === 'ar' ? 'منتج جديد' : 'New Product'),
        titleEn: prodTitle.trim() || 'New Product',
        category: activeChannel.category,
        categoryEn: activeChannel.categoryEn,
        description: postText.trim() || prodTitle.trim(),
        descriptionEn: postText.trim() || prodTitle.trim(),
        priceUSD: Math.max(1, Number(prodPrice) || 99),
        stock: Math.max(0, Number(prodStock) || 10),
        image: prodImageUrl || PRODUCT_IMAGES.watch,
        gallery: [prodImageUrl || PRODUCT_IMAGES.watch],
        videoUrl: prodMediaMode === 'video' && prodVideoUrl.trim() ? prodVideoUrl.trim() : undefined,
        mediaPreference: prodMediaMode,
        has3D,
        model3d: prod3dType,
        model3dUrl: has3D && prodGlbUrl.trim() ? prodGlbUrl.trim() : undefined,
        finish: 'titanium',
        sku: `CH-${Math.floor(1000 + Math.random() * 8999)}`,
        rating: 5.0,
        reviewCount: 0,
        specs: [activeChannel.category],
        specsEn: [activeChannel.categoryEn],
        reviews: [],
      };
      await onPublishProduct(newProd);
      setActiveTab('products');
    } else if (postType === 'live') {
      await onPublishPost({
        id: `post-live-${Date.now()}`,
        channelId: activeChannel.id,
        type: 'live',
        authorName: userName,
        authorHandle: userHandle,
        text: postText.trim() || liveTitle.trim() || (lang === 'ar' ? 'بث مباشر جديد' : 'Live broadcast started'),
        textEn: postText.trim() || liveTitle.trim() || 'Live broadcast started',
        liveTitle: liveTitle.trim() || (lang === 'ar' ? 'جلسة تسوق مباشرة' : 'Live Shopping Session'),
        liveTitleEn: liveTitle.trim() || 'Live Shopping Session',
        liveViewerCount: 1,
        liveActive: true,
        hasReplay: true,
        productId: attachedProductId || products.find((p) => p.channelId === activeChannel.id)?.id,
        allowComments: allowCommentsOnPublish,
        timestamp: lang === 'ar' ? 'الآن · مباشر' : 'Now · Live',
        viewsCount: 1,
        reactions: { heart: 0, thumbs: 0, fire: 0 },
        comments: [],
        liveChat: [],
      });
      setActiveTab('live');
    } else if (postType === 'poll') {
      const cleanOpts = pollOptions.map((o) => o.trim()).filter(Boolean);
      if (cleanOpts.length < 2) return;
      await onPublishPost({
        id: `post-poll-${Date.now()}`,
        channelId: activeChannel.id,
        type: 'poll',
        authorName: userName,
        authorHandle: userHandle,
        text: postText.trim(),
        textEn: postText.trim(),
        pinned: pinOnPublish,
        allowComments: allowCommentsOnPublish,
        pollOptions: cleanOpts.map((label, idx) => ({
          id: `opt-${Date.now()}-${idx}`,
          text: label,
          votes: 0,
          votedByHandles: [],
        })),
        timestamp: lang === 'ar' ? 'الآن' : 'Now',
        viewsCount: 1,
        reactions: { heart: 0, thumbs: 0, fire: 0 },
        comments: [],
      });
      setActiveTab('posts');
    } else {
      await onPublishPost({
        id: `post-ann-${Date.now()}`,
        channelId: activeChannel.id,
        type: 'announcement',
        authorName: userName,
        authorHandle: userHandle,
        text: postText.trim(),
        textEn: postText.trim(),
        image: postImageUrl.trim() ? postImageUrl.trim() : undefined,
        videoUrl: postVideoUrl.trim() ? postVideoUrl.trim() : undefined,
        productId: attachedProductId || undefined,
        pinned: pinOnPublish,
        allowComments: allowCommentsOnPublish,
        timestamp: lang === 'ar' ? 'الآن' : 'Now',
        viewsCount: 1,
        reactions: { heart: 0, thumbs: 0, fire: 0 },
        comments: [],
      });
      setActiveTab('posts');
    }

    setPostText('');
    setPostVideoUrl('');
    setPostImageUrl('');
    setAttachedProductId('');
    setPinOnPublish(false);
    setAllowCommentsOnPublish(true);
    setPollOptions(['', '']);
    setProdTitle('');
    setLiveTitle('');
    setProdGlbUrl('');
    setProdVideoUrl('');
    setPublishOpen(false);
  };

  if (!activeChannel) return null;

  const connectedServices = integrations.filter(
    (i) =>
      i.status === 'connected' &&
      (i.channelId === activeChannel.id || activeChannel.connectedPlatforms.includes(i.id))
  );
  const admins = activeChannel.members.filter((m) => m.role === 'owner' || m.role === 'moderator');

  const sectionTabs: { id: ChannelTab; ar: string; en: string; count: number }[] = [
    { id: 'posts', ar: 'المنشورات', en: 'Posts', count: channelPostsOnly.length },
    { id: 'products', ar: 'المنتجات', en: 'Products', count: channelProducts.length },
    { id: 'live', ar: 'البث المباشر', en: 'Live', count: channelLives.length },
    { id: 'groups', ar: 'مجموعة النقاش', en: 'Group', count: activeChannel.linkedGroupEnabled ? 1 : 0 },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-12">
      {/* Clean Channel Directory Rail */}
      <aside
        className={`flex flex-col overflow-hidden border-y border-[#E5E7EB] bg-white sm:rounded-2xl sm:border lg:col-span-4 ${
          mobileShowChannel ? 'hidden lg:flex' : 'flex'
        }`}
      >
        <div className="space-y-3 border-b border-[#E5E7EB] p-3.5 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h1 className="font-display text-base font-extrabold text-[#141518]">
                {t.nav.channels}
              </h1>
              <p className="text-[11px] text-[#6B7280]">
                {lang === 'ar'
                  ? 'قنوات المتاجر — النشر للأدمن والمشرفين'
                  : 'Merchant Channels — Admin publishing'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCreateChannelOpen(true)}
              className="inline-flex min-h-[36px] items-center gap-1 rounded-lg bg-[#059669] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#047857] whitespace-nowrap"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{lang === 'ar' ? 'قناة جديدة' : 'New Channel'}</span>
            </button>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6B7280]" />
            <input
              type="search"
              value={channelSearch}
              onChange={(e) => setChannelSearch(e.target.value)}
              placeholder={lang === 'ar' ? 'ابحث في القنوات...' : 'Search channels...'}
              className="w-full rounded-xl border border-[#D1D5DB] bg-[#F8F9FA] py-2 ps-8 pe-3 text-xs text-[#141518] outline-none focus:border-[#059669] focus:bg-white"
            />
          </div>
        </div>

        <div className="divide-y divide-[#F3F4F6]">
          {filteredChannels.map((ch) => {
            const selected = ch.id === activeChannel.id;
            const liveNow = posts.some(
              (p) => p.channelId === ch.id && p.type === 'live' && p.liveActive !== false
            );
            const chAdmin = isChannelAdmin(ch, userHandle);
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => {
                  onSelectChannel(ch.id);
                  setMobileShowChannel(true);
                }}
                className={`flex min-h-[68px] w-full items-center gap-3 px-3.5 py-3 text-start transition-colors ${
                  selected ? 'bg-[#ECFDF5]' : 'hover:bg-[#F8F9FA]'
                }`}
              >
                <img
                  src={ch.avatarImage}
                  alt={lang === 'ar' ? ch.name : ch.nameEn}
                  referrerPolicy="no-referrer"
                  className="h-11 w-11 shrink-0 rounded-full border border-[#E5E7EB] object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-1">
                      <span className="truncate text-xs font-bold text-[#141518] sm:text-[13px]">
                        {lang === 'ar' ? ch.name : ch.nameEn}
                      </span>
                      {ch.verified && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#059669]" />}
                    </div>
                    {liveNow ? (
                      <span className="shrink-0 text-[10px] font-bold text-[#DC2626]">
                        {t.common.live}
                      </span>
                    ) : (
                      chAdmin && (
                        <span className="shrink-0 text-[10px] font-bold text-[#059669]">
                          {lang === 'ar' ? 'مشرف' : 'Admin'}
                        </span>
                      )
                    )}
                  </div>
                  <div className="mt-0.5 truncate text-[11px] text-[#6B7280] tabular-nums">
                    {lang === 'ar' ? ch.category : ch.categoryEn} · {ch.followersCount.toLocaleString()}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Active Unified Channel Interface */}
      <div
        className={`space-y-4 px-2 sm:px-0 lg:col-span-8 ${
          mobileShowChannel ? 'block' : 'hidden lg:block'
        }`}
      >
        {/* Mobile Back to Directory */}
        <div className="flex items-center justify-between px-1 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileShowChannel(false)}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs font-semibold text-[#141518]"
          >
            <BackIcon className="h-3.5 w-3.5" />
            <span>{lang === 'ar' ? 'جميع القنوات' : 'All Channels'}</span>
          </button>

          {userIsAdmin && (
            <button
              type="button"
              onClick={() => {
                setPostType('announcement');
                setPublishOpen(true);
              }}
              className="inline-flex min-h-[38px] items-center gap-1 rounded-xl bg-[#141518] px-3 py-1.5 text-xs font-semibold text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{lang === 'ar' ? 'نشر في القناة' : 'Publish'}</span>
            </button>
          )}
        </div>

        {/* Channel Header */}
        <section className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white">
          <div className="h-28 border-b border-[#F3F4F6] bg-[#F3F4F6] sm:h-40">
            <img
              src={activeChannel.bannerImage}
              alt={lang === 'ar' ? activeChannel.name : activeChannel.nameEn}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="p-3.5 sm:px-6 sm:py-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setChannelInfoOpen(true)}
                className="group flex min-w-0 items-center gap-3 text-start"
              >
                <img
                  src={activeChannel.avatarImage}
                  alt={lang === 'ar' ? activeChannel.name : activeChannel.nameEn}
                  referrerPolicy="no-referrer"
                  className="h-12 w-12 shrink-0 rounded-full border border-[#E5E7EB] bg-white object-cover sm:h-14 sm:w-14"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h2 className="truncate font-display text-base font-extrabold text-[#141518] group-hover:text-[#059669] sm:text-lg">
                      {lang === 'ar' ? activeChannel.name : activeChannel.nameEn}
                    </h2>
                    {activeChannel.verified && (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-[#059669]" />
                    )}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-[#6B7280] tabular-nums sm:text-xs">
                    <span>
                      {activeChannel.followersCount.toLocaleString()}{' '}
                      {lang === 'ar' ? 'مشترك' : 'subscribers'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 font-medium text-[#059669]">
                      <Info className="h-3.5 w-3.5" />
                      <span>{lang === 'ar' ? 'معلومات القناة' : 'Channel Info'}</span>
                    </span>
                  </div>
                </div>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onToggleFollow(activeChannel.id)}
                  className={`min-h-[38px] rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                    activeChannel.isFollowed
                      ? 'border border-[#059669] bg-[#ECFDF5] text-[#059669]'
                      : 'bg-[#059669] text-white hover:bg-[#047857]'
                  }`}
                >
                  {activeChannel.isFollowed ? t.common.following : t.common.follow}
                </button>

                <button
                  type="button"
                  onClick={() => onToggleMute(activeChannel.id)}
                  aria-label="Toggle channel notifications"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E5E7EB] text-[#4B5563] transition-colors hover:bg-[#F8F9FA]"
                >
                  {activeChannel.isMuted ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                </button>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setMenuOpen((prev) => !prev)}
                    aria-label="More channel options"
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E5E7EB] text-[#4B5563] transition-colors hover:bg-[#F8F9FA]"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>

                  {menuOpen && (
                    <div className="absolute end-0 z-30 mt-2 w-60 rounded-xl border border-[#E5E7EB] bg-white p-1.5 shadow-lg">
                      <button
                        type="button"
                        onClick={() => {
                          setChannelInfoOpen(true);
                          setMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-start text-xs font-semibold text-[#141518] hover:bg-[#F3F4F6]"
                      >
                        <Info className="h-4 w-4 text-[#059669]" />
                        <span>{lang === 'ar' ? 'معلومات القناة الكاملة' : 'Channel Information'}</span>
                      </button>
                      {userIsAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            setPublishOpen(true);
                            setMenuOpen(false);
                          }}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-start text-xs font-semibold text-[#141518] hover:bg-[#F3F4F6]"
                        >
                          <Plus className="h-4 w-4 text-[#059669]" />
                          <span>{lang === 'ar' ? 'نشر منشور / منتج / بث' : 'Publish Content'}</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setMembersOpen(true);
                          setMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-start text-xs font-semibold text-[#141518] hover:bg-[#F3F4F6]"
                      >
                        <Shield className="h-4 w-4 text-[#059669]" />
                        <span>{lang === 'ar' ? 'الأعضاء والمشرفون' : 'Admins & Members'}</span>
                      </button>
                      {userIsAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            setIntegrationsOpen(true);
                            setMenuOpen(false);
                          }}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-start text-xs font-semibold text-[#141518] hover:bg-[#F3F4F6]"
                        >
                          <Blocks className="h-4 w-4 text-[#059669]" />
                          <span>{lang === 'ar' ? 'الخدمات والمتاجر المربوطة' : 'Connected Stores'}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Channel Tabs & In-Channel Search */}
            <div className="mt-4 flex flex-col gap-2.5 border-t border-[#F3F4F6] pt-3.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] p-1">
                {sectionTabs.map((tab) => {
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                        active ? 'bg-white text-[#141518] shadow-xs' : 'text-[#6B7280] hover:text-[#141518]'
                      }`}
                    >
                      <span>{lang === 'ar' ? tab.ar : tab.en}</span>
                      <span className="font-mono-data text-[11px] text-[#6B7280] tabular-nums">{tab.count}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:w-48">
                  <Search className="pointer-events-none absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6B7280]" />
                  <input
                    type="search"
                    value={inChannelSearch}
                    onChange={(e) => setInChannelSearch(e.target.value)}
                    placeholder={lang === 'ar' ? 'ابحث في القناة...' : 'Search channel...'}
                    className="w-full rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] py-1.5 ps-8 pe-2.5 text-xs outline-none focus:border-[#059669] focus:bg-white"
                  />
                </div>
                {userIsAdmin && (
                  <button
                    type="button"
                    onClick={() => setPublishOpen(true)}
                    className="hidden min-h-[36px] items-center gap-1 rounded-xl bg-[#141518] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#059669] whitespace-nowrap sm:inline-flex"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>{lang === 'ar' ? 'نشر' : 'Publish'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Admin Quick Publish Bar OR Read-Only Subscriber Notice */}
        {userIsAdmin ? (
          <div className="rounded-2xl border border-[#A7F3D0] bg-white p-3.5 sm:p-4">
            <form onSubmit={handleQuickPublish} className="flex items-center gap-2">
              <input
                type="text"
                value={quickText}
                onChange={(e) => setQuickText(e.target.value)}
                placeholder={
                  lang === 'ar'
                    ? 'اكتب منشوراً سريعاً بصفتك مشرف القناة...'
                    : 'Write a quick channel post as admin...'
                }
                className="min-w-0 flex-1 rounded-xl border border-[#D1D5DB] bg-[#F8F9FA] px-3.5 py-2 text-xs text-[#141518] outline-none focus:border-[#059669] focus:bg-white"
              />
              <button
                type="submit"
                disabled={!quickText.trim()}
                className="inline-flex min-h-[38px] shrink-0 items-center gap-1.5 rounded-xl bg-[#059669] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#047857] disabled:opacity-45 whitespace-nowrap"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{lang === 'ar' ? 'نشر سريع' : 'Post'}</span>
              </button>
            </form>
            <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px]">
              <span className="font-semibold text-[#6B7280]">
                {lang === 'ar' ? 'إضافة متقدمة:' : 'Create:'}
              </span>
              {(
                [
                  { id: 'announcement', ar: 'منشور بصورة/منتج', en: 'Rich Post', Icon: ImageIcon },
                  { id: 'product', ar: 'منتج جديد', en: 'New Product', Icon: ShoppingBag },
                  { id: 'poll', ar: 'استطلاع رأي', en: 'Poll', Icon: BarChart3 },
                  { id: 'live', ar: 'بث مباشر', en: 'Go Live', Icon: Radio },
                ] as const
              ).map(({ id, ar, en, Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setPostType(id);
                    setPublishOpen(true);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#E5E7EB] bg-[#F8F9FA] px-2.5 py-1.5 font-semibold text-[#141518] hover:border-[#059669] hover:text-[#059669] whitespace-nowrap"
                >
                  <Icon className="h-3 w-3 text-[#059669]" />
                  <span>{lang === 'ar' ? ar : en}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3 text-xs">
            <div className="flex items-center gap-2 text-[#4B5563]">
              <Lock className="h-4 w-4 shrink-0 text-[#6B7280]" />
              <span>
                {lang === 'ar'
                  ? 'النشر في هذه القناة متاح للأدمن والمشرفين فقط. يمكنك التفاعل، التصويت، أو المناقشة في المجموعة.'
                  : 'Publishing in this channel is reserved for channel admins. You can react, vote, comment, or join the discussion group.'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {activeChannel.linkedGroupEnabled && (
                <button
                  type="button"
                  onClick={() => onOpenLinkedGroup(activeChannel.linkedGroupId, activeChannel.id)}
                  className="font-semibold text-[#059669] hover:underline whitespace-nowrap"
                >
                  {lang === 'ar' ? 'فتح المجموعة' : 'Discussion Group'}
                </button>
              )}
              <button
                type="button"
                onClick={() => onContactOwner(activeChannel.id)}
                className="font-semibold text-[#141518] hover:text-[#059669] whitespace-nowrap"
              >
                {lang === 'ar' ? 'مراسلة المالك' : 'Message Owner'}
              </button>
            </div>
          </div>
        )}

        {/* TAB 1: Channel Posts (Announcements + Embedded Product Posts + Polls + Comments) */}
        {activeTab === 'posts' && (
          <section className="space-y-4">
            {channelPostsOnly.length === 0 ? (
              <div className="rounded-2xl border border-[#E5E7EB] bg-white p-10 text-center text-xs text-[#6B7280]">
                {lang === 'ar'
                  ? 'لا توجد منشورات في هذه القناة بعد.'
                  : 'No channel posts published yet.'}
              </div>
            ) : (
              channelPostsOnly.map((post) => (
                <ChannelPostCard
                  key={post.id}
                  lang={lang}
                  post={post}
                  channel={activeChannel}
                  product={post.productId ? products.find((p) => p.id === post.productId) : undefined}
                  isAdmin={userIsAdmin}
                  userHandle={userHandle}
                  threads={threads}
                  onOpenProduct={onOpenProduct}
                  onAddToCart={onAddToCart}
                  onReact={onReactPost}
                  onAddComment={onAddComment}
                  onSendLiveChat={onSendLiveChat}
                  onPinPost={userIsAdmin ? onPinPost : undefined}
                  onVotePoll={onVotePoll}
                  onForwardPost={onForwardPost}
                />
              ))
            )}
          </section>
        )}

        {/* TAB 2: Products Inside Channel */}
        {activeTab === 'products' && (
          <section>
            {channelProducts.length === 0 ? (
              <div className="rounded-2xl border border-[#E5E7EB] bg-white p-10 text-center text-xs text-[#6B7280]">
                {lang === 'ar'
                  ? 'لا توجد منتجات منشورة في هذه القناة بعد.'
                  : 'No products published in this channel yet.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
                {channelProducts.map((product) => (
                  <EcommerceProductCard
                    key={product.id}
                    lang={lang}
                    product={product}
                    onOpenProduct={onOpenProduct}
                    onAddToCart={onAddToCart}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* TAB 3: Live Broadcasts & Replays Inside Channel */}
        {activeTab === 'live' && (
          <section className="space-y-4">
            {channelLives.length === 0 ? (
              <div className="rounded-2xl border border-[#E5E7EB] bg-white p-10 text-center">
                <p className="text-xs text-[#6B7280]">
                  {lang === 'ar'
                    ? 'لا يوجد بث مباشر أو إعادة بث في هذه القناة حالياً.'
                    : 'No active live broadcast or replay in this channel right now.'}
                </p>
                {userIsAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setPostType('live');
                      setPublishOpen(true);
                    }}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#059669] px-4 py-2 text-xs font-semibold text-white hover:bg-[#047857]"
                  >
                    <Radio className="h-3.5 w-3.5" />
                    <span>{lang === 'ar' ? 'بدء بث مباشر في القناة' : 'Start Channel Broadcast'}</span>
                  </button>
                )}
              </div>
            ) : (
              channelLives.map((post) => (
                <ChannelPostCard
                  key={post.id}
                  lang={lang}
                  post={post}
                  channel={activeChannel}
                  product={post.productId ? products.find((p) => p.id === post.productId) : undefined}
                  isAdmin={userIsAdmin}
                  userHandle={userHandle}
                  threads={threads}
                  onOpenProduct={onOpenProduct}
                  onAddToCart={onAddToCart}
                  onReact={onReactPost}
                  onAddComment={onAddComment}
                  onSendLiveChat={onSendLiveChat}
                  onToggleLiveStatus={userIsAdmin ? onToggleLiveStatus : undefined}
                  onForwardPost={onForwardPost}
                />
              ))
            )}
          </section>
        )}

        {/* TAB 4: Linked Discussion Group */}
        {activeTab === 'groups' && (
          <section className="rounded-2xl border border-[#E5E7EB] bg-white p-4 sm:p-5">
            {!activeChannel.linkedGroupEnabled ? (
              <div className="py-8 text-center text-xs text-[#6B7280]">
                {lang === 'ar'
                  ? 'مجموعة النقاش المرتبطة بهذه القناة معطلة حالياً.'
                  : 'No active discussion group linked to this channel.'}
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <img
                    src={activeChannel.avatarImage}
                    alt={lang === 'ar' ? activeChannel.linkedGroupName : activeChannel.linkedGroupNameEn}
                    referrerPolicy="no-referrer"
                    className="h-14 w-14 shrink-0 rounded-full border border-[#E5E7EB] object-cover"
                  />
                  <div>
                    <h3 className="font-display text-base font-bold text-[#141518]">
                      {lang === 'ar' ? activeChannel.linkedGroupName : activeChannel.linkedGroupNameEn}
                    </h3>
                    <p className="mt-1 text-xs text-[#4B5563]">
                      {lang === 'ar'
                        ? activeChannel.linkedGroupDescription || activeChannel.description
                        : activeChannel.linkedGroupDescriptionEn || activeChannel.descriptionEn}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-[#6B7280] tabular-nums">
                      <Users className="h-3.5 w-3.5 text-[#059669]" />
                      <span>
                        {activeChannel.members.length.toLocaleString()}{' '}
                        {lang === 'ar' ? 'أعضاء نشطين' : 'members'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-medium text-[#059669]">
                        {activeChannel.groupPermissions?.postingPolicy === 'admins_only'
                          ? lang === 'ar'
                            ? 'النشر للمشرفين فقط'
                            : 'Admins only'
                          : activeChannel.groupPermissions?.postingPolicy === 'approved_only'
                          ? lang === 'ar'
                            ? 'للأعضاء المصرّح لهم'
                            : 'Approved members'
                          : lang === 'ar'
                          ? 'مفتوحة للنقاش'
                          : 'Open to members'}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenLinkedGroup(activeChannel.linkedGroupId, activeChannel.id)}
                  className="min-h-[40px] rounded-xl bg-[#059669] px-4 py-2 text-xs font-semibold text-white hover:bg-[#047857] whitespace-nowrap"
                >
                  {lang === 'ar' ? 'فتح المجموعة في المحادثات' : 'Open Group in Chats'}
                </button>
              </div>
            )}
          </section>
        )}
      </div>

      {/* Channel Information Modal */}
      {channelInfoOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={lang === 'ar' ? 'معلومات القناة' : 'Channel Information'}
        >
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-[#E5E7EB] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] px-5 py-4">
              <h3 className="font-display text-base font-extrabold text-[#141518]">
                {lang === 'ar' ? 'معلومات القناة' : 'Channel Information'}
              </h3>
              <button
                type="button"
                onClick={() => setChannelInfoOpen(false)}
                className="rounded-lg p-1 text-[#6B7280] hover:bg-[#F3F4F6]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="divide-y divide-[#F3F4F6] p-5 text-xs">
              <div className="pb-5">
                <div className="flex items-center gap-3.5">
                  <img
                    src={activeChannel.avatarImage}
                    alt={lang === 'ar' ? activeChannel.name : activeChannel.nameEn}
                    referrerPolicy="no-referrer"
                    className="h-14 w-14 rounded-full border border-[#E5E7EB] object-cover"
                  />
                  <div>
                    <div className="flex items-center gap-1.5 text-base font-extrabold text-[#141518]">
                      <span>{lang === 'ar' ? activeChannel.name : activeChannel.nameEn}</span>
                      {activeChannel.verified && <CheckCircle2 className="h-4 w-4 text-[#059669]" />}
                    </div>
                    <div className="text-[#6B7280] tabular-nums">
                      {activeChannel.handle} · {activeChannel.followersCount.toLocaleString()}{' '}
                      {lang === 'ar' ? 'مشترك' : 'subscribers'}
                    </div>
                  </div>
                </div>
                <p className="mt-3 leading-relaxed text-[#4B5563]">
                  {lang === 'ar' ? activeChannel.description : activeChannel.descriptionEn}
                </p>
              </div>

              <div className="flex items-center justify-between py-4">
                <div>
                  <div className="text-[#6B7280]">{lang === 'ar' ? 'مالك القناة' : 'Channel Owner'}</div>
                  <div className="mt-0.5 text-sm font-bold text-[#141518]">
                    {lang === 'ar' ? activeChannel.ownerName : activeChannel.ownerNameEn}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setChannelInfoOpen(false);
                    onContactOwner(activeChannel.id);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#D1D5DB] px-3 py-1.5 font-semibold text-[#141518] hover:border-[#059669] hover:text-[#059669]"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span>{lang === 'ar' ? 'مراسلة المالك' : 'Contact Owner'}</span>
                </button>
              </div>

              <div className="py-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-bold text-[#141518]">
                    {lang === 'ar' ? 'المشرفون المخوّلون بالنشر' : 'Publishing Administrators'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setChannelInfoOpen(false);
                      setMembersOpen(true);
                    }}
                    className="font-semibold text-[#059669] hover:underline"
                  >
                    {lang === 'ar' ? 'عرض القائمة' : 'Manage'}
                  </button>
                </div>
                <div className="space-y-2">
                  {admins.map((adm) => (
                    <div key={adm.id} className="flex items-center justify-between">
                      <span className="font-semibold text-[#141518]">{adm.name}</span>
                      <span className="text-[#6B7280]">
                        {adm.handle} · {adm.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-bold text-[#141518]">
                    {lang === 'ar' ? 'الروابط والمتاجر المربوطة' : 'External Links & Connected Stores'}
                  </span>
                  {userIsAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setChannelInfoOpen(false);
                        setIntegrationsOpen(true);
                      }}
                      className="font-semibold text-[#059669] hover:underline"
                    >
                      {lang === 'ar' ? 'إدارة المتاجر' : 'Configure'}
                    </button>
                  )}
                </div>
                <div className="space-y-1.5">
                  {(activeChannel.externalLinks || []).map((lnk, idx) => (
                    <a
                      key={idx}
                      href={lnk.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between rounded-lg border border-[#E5E7EB] px-3 py-2 text-[#141518] hover:border-[#059669]"
                    >
                      <span className="font-semibold">{lnk.label}</span>
                      <ExternalLink className="h-3.5 w-3.5 text-[#6B7280]" />
                    </a>
                  ))}
                  {connectedServices.length > 0 && (
                    <div className="pt-1 text-[#059669]">
                      {lang === 'ar' ? 'المتاجر المتزامنة:' : 'Synced stores:'}{' '}
                      {connectedServices.map((s) => s.name).join(', ')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Channel Modal */}
      {createChannelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!newChName.trim()) return;
              await onCreateChannel(newChName.trim(), newChCat.trim() || 'تجارة عامة', newChDesc.trim());
              setNewChName('');
              setNewChCat('');
              setNewChDesc('');
              setCreateChannelOpen(false);
              setMobileShowChannel(true);
            }}
            className="w-full max-w-md space-y-4 rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <h3 className="font-display text-base font-bold text-[#141518]">
                {lang === 'ar' ? 'إنشاء قناة جديدة' : 'Create Channel'}
              </h3>
              <button type="button" onClick={() => setCreateChannelOpen(false)} className="text-[#6B7280]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <input
              type="text"
              required
              value={newChName}
              onChange={(e) => setNewChName(e.target.value)}
              placeholder={lang === 'ar' ? 'اسم القناة' : 'Channel name'}
              className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-xs"
            />
            <input
              type="text"
              value={newChCat}
              onChange={(e) => setNewChCat(e.target.value)}
              placeholder={lang === 'ar' ? 'التصنيف' : 'Category'}
              className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-xs"
            />
            <textarea
              rows={3}
              value={newChDesc}
              onChange={(e) => setNewChDesc(e.target.value)}
              placeholder={lang === 'ar' ? 'وصف القناة...' : 'Channel description...'}
              className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-xs"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setCreateChannelOpen(false)} className="rounded-lg border border-[#D1D5DB] px-4 py-2 text-xs font-semibold">
                {t.common.cancel}
              </button>
              <button type="submit" className="rounded-lg bg-[#059669] px-4 py-2 text-xs font-semibold text-white">
                {lang === 'ar' ? 'إنشاء' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Upgraded Admin-Only Publish Modal (Posts / Products / Polls / Live) */}
      {publishOpen && userIsAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <form
            onSubmit={handlePublishSubmit}
            className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-xl sm:p-6"
          >
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <div>
                <h3 className="font-display text-base font-bold text-[#141518]">
                  {lang === 'ar' ? 'نشر في القناة' : 'Publish to Channel'}
                </h3>
                <p className="text-[11px] text-[#059669]">
                  {lang === 'ar' ? `بصفتك مشرف في ${activeChannel.name}` : `Publishing as admin of ${activeChannel.nameEn}`}
                </p>
              </div>
              <button type="button" onClick={() => setPublishOpen(false)} className="text-[#6B7280]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-1 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] p-1">
              {(
                [
                  { id: 'announcement', ar: 'منشور', en: 'Post' },
                  { id: 'product', ar: 'منتج', en: 'Product' },
                  { id: 'poll', ar: 'استطلاع', en: 'Poll' },
                  { id: 'live', ar: 'بث مباشر', en: 'Live' },
                ] as const
              ).map((pt) => (
                <button
                  key={pt.id}
                  type="button"
                  onClick={() => setPostType(pt.id)}
                  className={`rounded-lg py-1.5 text-xs font-semibold transition-colors ${
                    postType === pt.id ? 'bg-[#059669] text-white' : 'text-[#4B5563]'
                  }`}
                >
                  {lang === 'ar' ? pt.ar : pt.en}
                </button>
              ))}
            </div>

            {postType === 'product' && (
              <div className="space-y-3">
                <input
                  type="text"
                  required
                  value={prodTitle}
                  onChange={(e) => setProdTitle(e.target.value)}
                  placeholder={lang === 'ar' ? 'اسم المنتج' : 'Product name'}
                  className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-xs"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    min={1}
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    placeholder="Price USD"
                    className="rounded-lg border border-[#D1D5DB] px-3 py-2 font-mono-data text-xs"
                  />
                  <input
                    type="number"
                    min={0}
                    value={prodStock}
                    onChange={(e) => setProdStock(e.target.value)}
                    placeholder="Stock"
                    className="rounded-lg border border-[#D1D5DB] px-3 py-2 font-mono-data text-xs"
                  />
                </div>

                <div>
                  <div className="mb-1.5 text-xs font-semibold text-[#141518]">
                    {lang === 'ar' ? 'الوسائط:' : 'Product Media:'}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { id: 'images', ar: 'صور', en: 'Images', icon: ImageIcon },
                        { id: 'video', ar: 'فيديو', en: 'Video', icon: Video },
                        { id: 'model3d', ar: 'نموذج 3D', en: '3D Model', icon: Box },
                      ] as const
                    ).map(({ id, ar, en, icon: Icon }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setProdMediaMode(id)}
                        className={`flex items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-semibold ${
                          prodMediaMode === id
                            ? 'border-[#059669] bg-[#ECFDF5] text-[#059669]'
                            : 'border-[#E5E7EB] text-[#4B5563]'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span>{lang === 'ar' ? ar : en}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={prodImageUrl.startsWith('data:') ? 'custom' : prodImageUrl}
                    onChange={(e) => {
                      if (e.target.value !== 'custom') setProdImageUrl(e.target.value);
                    }}
                    className="flex-1 rounded-lg border border-[#D1D5DB] bg-white px-3 py-2 text-xs"
                  >
                    <option value={PRODUCT_IMAGES.watch}>Watch Studio Photo</option>
                    <option value={PRODUCT_IMAGES.headphones}>Headphones Studio Photo</option>
                    <option value={PRODUCT_IMAGES.perfume}>Fragrance Flacon Photo</option>
                    <option value={PRODUCT_IMAGES.vault}>Hardware Vault Photo</option>
                    <option value={PRODUCT_IMAGES.lamp}>Architectural Lamp Photo</option>
                    <option value={PRODUCT_IMAGES.folio}>Leather Folio Photo</option>
                    {prodImageUrl.startsWith('data:') && (
                      <option value="custom">{lang === 'ar' ? 'صورة مرفوعة' : 'Uploaded Image'}</option>
                    )}
                  </select>
                  <input
                    ref={prodUploadInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleLocalImageUpload(e, setProdImageUrl)}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => prodUploadInputRef.current?.click()}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[#D1D5DB] px-3 py-2 text-xs font-semibold text-[#141518] hover:border-[#059669]"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>{lang === 'ar' ? 'رفع' : 'Upload'}</span>
                  </button>
                </div>

                {prodMediaMode === 'video' && (
                  <input
                    type="url"
                    dir="ltr"
                    value={prodVideoUrl}
                    onChange={(e) => setProdVideoUrl(e.target.value)}
                    placeholder="https://example.com/product.mp4"
                    className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 font-mono-data text-xs"
                  />
                )}

                {prodMediaMode === 'model3d' && (
                  <div className="space-y-2 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] p-3">
                    <select
                      value={prod3dType}
                      onChange={(e) => setProd3dType(e.target.value as Product3DModelType)}
                      className="w-full rounded-lg border border-[#D1D5DB] bg-white px-3 py-2 text-xs"
                    >
                      <option value="watch">Built-in 3D Studio: Chronograph</option>
                      <option value="headphones">Built-in 3D Studio: Headphones</option>
                      <option value="perfume">Built-in 3D Studio: Crystal Flacon</option>
                      <option value="vault">Built-in 3D Studio: Hardware Unit</option>
                    </select>
                    <input
                      type="url"
                      dir="ltr"
                      value={prodGlbUrl}
                      onChange={(e) => setProdGlbUrl(e.target.value)}
                      placeholder="Optional GLB / GLTF URL (https://.../model.glb)"
                      className="w-full rounded-lg border border-[#D1D5DB] bg-white px-3 py-2 font-mono-data text-xs"
                    />
                  </div>
                )}
              </div>
            )}

            {postType === 'announcement' && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={uploadInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleLocalImageUpload(e, setPostImageUrl)}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => uploadInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#D1D5DB] px-3 py-2 text-xs font-semibold text-[#141518] hover:border-[#059669]"
                  >
                    <Upload className="h-3.5 w-3.5 text-[#059669]" />
                    <span>{lang === 'ar' ? 'رفع صورة من الجهاز' : 'Upload Image'}</span>
                  </button>
                  {postImageUrl && (
                    <button
                      type="button"
                      onClick={() => setPostImageUrl('')}
                      className="text-xs font-semibold text-[#DC2626]"
                    >
                      {lang === 'ar' ? 'إزالة الصورة' : 'Remove photo'}
                    </button>
                  )}
                </div>
                {postImageUrl && (
                  <img
                    src={postImageUrl}
                    alt="Preview"
                    className="max-h-40 w-full rounded-xl border border-[#E5E7EB] object-cover"
                  />
                )}
                <input
                  type="url"
                  dir="ltr"
                  value={postVideoUrl}
                  onChange={(e) => setPostVideoUrl(e.target.value)}
                  placeholder={lang === 'ar' ? 'رابط فيديو اختياري (MP4)' : 'Optional Video URL (MP4)'}
                  className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 font-mono-data text-xs"
                />
                {channelProducts.length > 0 && (
                  <select
                    value={attachedProductId}
                    onChange={(e) => setAttachedProductId(e.target.value)}
                    className="w-full rounded-lg border border-[#D1D5DB] bg-white px-3 py-2 text-xs"
                  >
                    <option value="">
                      {lang === 'ar' ? 'إرفاق منتج من القناة (اختياري)...' : 'Attach channel product (optional)...'}
                    </option>
                    {channelProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {lang === 'ar' ? p.title : p.titleEn} (${p.priceUSD})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {postType === 'poll' && (
              <div className="space-y-2.5 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] p-3">
                <div className="text-xs font-bold text-[#141518]">
                  {lang === 'ar' ? 'خيارات الاستطلاع' : 'Poll Options'}
                </div>
                {pollOptions.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      required={idx < 2}
                      value={opt}
                      onChange={(e) =>
                        setPollOptions((prev) => prev.map((v, i) => (i === idx ? e.target.value : v)))
                      }
                      placeholder={lang === 'ar' ? `الخيار ${idx + 1}` : `Option ${idx + 1}`}
                      className="flex-1 rounded-lg border border-[#D1D5DB] bg-white px-3 py-2 text-xs"
                    />
                    {pollOptions.length > 2 && (
                      <button
                        type="button"
                        onClick={() => setPollOptions((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-[#6B7280] hover:text-[#DC2626]"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                {pollOptions.length < 4 && (
                  <button
                    type="button"
                    onClick={() => setPollOptions((prev) => [...prev, ''])}
                    className="text-xs font-semibold text-[#059669] hover:underline"
                  >
                    + {lang === 'ar' ? 'إضافة خيار' : 'Add option'}
                  </button>
                )}
              </div>
            )}

            {postType === 'live' && (
              <input
                type="text"
                required
                value={liveTitle}
                onChange={(e) => setLiveTitle(e.target.value)}
                placeholder={lang === 'ar' ? 'عنوان البث المباشر' : 'Live broadcast title'}
                className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-xs"
              />
            )}

            <textarea
              rows={3}
              required={postType === 'announcement' || postType === 'poll'}
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              placeholder={
                postType === 'poll'
                  ? lang === 'ar'
                    ? 'سؤال الاستطلاع...'
                    : 'Poll question...'
                  : lang === 'ar'
                  ? 'نص المنشور أو وصف المنتج...'
                  : 'Post text or product description...'
              }
              className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-xs"
            />

            {/* Post Visibility & Comment Options */}
            <div className="flex flex-wrap items-center gap-4 border-t border-[#F3F4F6] pt-3 text-xs">
              {postType !== 'live' && postType !== 'product' && (
                <label className="inline-flex cursor-pointer items-center gap-2 font-medium text-[#141518]">
                  <input
                    type="checkbox"
                    checked={pinOnPublish}
                    onChange={(e) => setPinOnPublish(e.target.checked)}
                    className="h-4 w-4 accent-[#059669]"
                  />
                  <Pin className="h-3.5 w-3.5 text-[#059669]" />
                  <span>{lang === 'ar' ? 'تثبيت في أعلى القناة' : 'Pin to top'}</span>
                </label>
              )}
              <label className="inline-flex cursor-pointer items-center gap-2 font-medium text-[#141518]">
                <input
                  type="checkbox"
                  checked={allowCommentsOnPublish}
                  onChange={(e) => setAllowCommentsOnPublish(e.target.checked)}
                  className="h-4 w-4 accent-[#059669]"
                />
                <span>{lang === 'ar' ? 'السماح بالتعليقات' : 'Allow comments'}</span>
              </label>
            </div>

            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setPublishOpen(false)} className="rounded-lg border border-[#D1D5DB] px-4 py-2 text-xs font-semibold">
                {t.common.cancel}
              </button>
              <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg bg-[#059669] px-4 py-2 text-xs font-semibold text-white">
                <Radio className="h-3.5 w-3.5" />
                <span>{lang === 'ar' ? 'نشر الآن' : 'Publish'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Admins & Members Moderation Modal */}
      {membersOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-xl sm:p-6">
            <div className="mb-4 flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <h3 className="font-display text-base font-bold text-[#141518]">
                {lang === 'ar' ? 'المشرفون والأعضاء' : 'Admins & Members'}
              </h3>
              <button type="button" onClick={() => setMembersOpen(false)} className="text-[#6B7280]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-4 flex items-center justify-between rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] p-3.5 text-xs">
              <div>
                <div className="font-bold text-[#141518]">
                  {lang === 'ar' ? 'مجموعة النقاش المرتبطة' : 'Linked Discussion Group'}
                </div>
                <div className="text-[#6B7280]">
                  {lang === 'ar' ? activeChannel.linkedGroupName : activeChannel.linkedGroupNameEn}
                </div>
              </div>
              {userIsAdmin && (
                <button
                  type="button"
                  onClick={() => onToggleLinkedGroup(activeChannel.id)}
                  className={`rounded-lg px-3 py-1.5 font-semibold ${
                    activeChannel.linkedGroupEnabled
                      ? 'bg-[#059669] text-white'
                      : 'border border-[#D1D5DB] bg-white text-[#4B5563]'
                  }`}
                >
                  {activeChannel.linkedGroupEnabled
                    ? lang === 'ar'
                      ? 'مفعّلة'
                      : 'Enabled'
                    : lang === 'ar'
                    ? 'معطّلة'
                    : 'Disabled'}
                </button>
              )}
            </div>

            {userIsAdmin && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!newMemName.trim() || !newMemHandle.trim()) return;
                  const ok = await onAddMember(activeChannel.id, {
                    name: newMemName.trim(),
                    handle: newMemHandle.trim(),
                    role: newMemRole,
                  });
                  if (ok) {
                    setNewMemName('');
                    setNewMemHandle('');
                  }
                }}
                className="mb-4 space-y-2 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] p-3 text-xs"
              >
                <div className="flex items-center gap-1.5 font-bold text-[#141518]">
                  <UserPlus className="h-3.5 w-3.5 text-[#059669]" />
                  <span>{lang === 'ar' ? 'إضافة عضو أو مشرف' : 'Add Member or Admin'}</span>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <input
                    type="text"
                    required
                    value={newMemName}
                    onChange={(e) => setNewMemName(e.target.value)}
                    placeholder={lang === 'ar' ? 'الاسم' : 'Name'}
                    className="rounded-lg border border-[#D1D5DB] bg-white px-2.5 py-1.5"
                  />
                  <input
                    type="text"
                    required
                    dir="ltr"
                    value={newMemHandle}
                    onChange={(e) => setNewMemHandle(e.target.value)}
                    placeholder="@handle"
                    className="rounded-lg border border-[#D1D5DB] bg-white px-2.5 py-1.5 font-mono-data"
                  />
                  <select
                    value={newMemRole}
                    onChange={(e) => setNewMemRole(e.target.value as 'moderator' | 'member')}
                    className="rounded-lg border border-[#D1D5DB] bg-white px-2.5 py-1.5"
                  >
                    <option value="moderator">{lang === 'ar' ? 'مشرف (يسمح بالنشر)' : 'Admin (Can post)'}</option>
                    <option value="member">{lang === 'ar' ? 'عضو' : 'Member'}</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="rounded-lg bg-[#059669] px-3 py-1.5 font-semibold text-white hover:bg-[#047857]"
                >
                  {lang === 'ar' ? 'إضافة للقناة' : 'Add'}
                </button>
              </form>
            )}

            <div className="divide-y divide-[#F3F4F6] text-xs">
              {activeChannel.members.map((mem) => {
                const isSelf = normalizeHandle(mem.handle) === normalizeHandle(userHandle);
                return (
                  <div key={mem.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                    <div>
                      <div className="font-bold text-[#141518]">{mem.name}</div>
                      <div className="text-[#6B7280]">
                        {mem.handle} ·{' '}
                        {mem.role === 'owner'
                          ? lang === 'ar'
                            ? 'مالك'
                            : 'Owner'
                          : mem.role === 'moderator'
                          ? lang === 'ar'
                            ? 'مشرف'
                            : 'Admin'
                          : lang === 'ar'
                          ? 'عضو'
                          : 'Member'}
                      </div>
                    </div>
                    {userIsAdmin && mem.role !== 'owner' && !isSelf && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateMemberRole(activeChannel.id, mem.id, {
                              role: mem.role === 'moderator' ? 'member' : 'moderator',
                            })
                          }
                          className="rounded-lg border border-[#E5E7EB] px-2.5 py-1 font-semibold text-[#141518] hover:border-[#059669]"
                        >
                          {mem.role === 'moderator'
                            ? lang === 'ar'
                              ? 'إزالة الإشراف'
                              : 'Demote'
                            : lang === 'ar'
                            ? 'ترقية لمشرف'
                            : 'Promote'}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateMemberRole(activeChannel.id, mem.id, { muted: !mem.muted })
                          }
                          className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 font-semibold ${
                            mem.muted
                              ? 'border-[#DC2626] bg-[#FEF2F2] text-[#DC2626]'
                              : 'border-[#E5E7EB] text-[#4B5563]'
                          }`}
                        >
                          <VolumeX className="h-3 w-3" />
                          <span>
                            {mem.muted
                              ? lang === 'ar'
                                ? 'مكتوم'
                                : 'Muted'
                              : lang === 'ar'
                              ? 'كتم'
                              : 'Mute'}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Connected Commerce Stores Modal */}
      {integrationsOpen && userIsAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <div>
                <h3 className="font-display text-base font-bold text-[#141518]">
                  {lang === 'ar' ? 'ربط المتاجر الخارجية بالقناة' : 'Channel Commerce Integrations'}
                </h3>
                <p className="text-xs text-[#6B7280]">
                  {lang === 'ar' ? activeChannel.name : activeChannel.nameEn}
                </p>
              </div>
              <button type="button" onClick={() => setIntegrationsOpen(false)} className="text-[#6B7280]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <CommerceIntegrationsPanel
              lang={lang}
              integrations={integrations}
              channels={channels}
              defaultChannelId={activeChannel.id}
              onConnect={onConnectIntegration}
              onSync={onSyncIntegration}
              onDisconnect={onDisconnectIntegration}
              onFetchOrders={onFetchIntegrationOrders}
            />
          </div>
        </div>
      )}
    </div>
  );
};
