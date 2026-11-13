import React, { useState } from 'react';
import {
  Box,
  Check,
  Clapperboard,
  Eye,
  Heart,
  Megaphone,
  Pin,
  Plus,
  Radio,
  Search,
  Send,
  ShoppingBag,
  ThumbsUp,
  Users,
} from 'lucide-react';
import {
  ChannelPost,
  GroupMessage,
  LiveStreamState,
  Product,
  ProductFinish,
  StoreChannel,
} from '../types/commerce';
import { TikTokLivePlayer } from './TikTokLivePlayer';

interface TelegramChannelsHubProps {
  channels: StoreChannel[];
  activeChannelId: string;
  onSelectChannel: (channelId: string) => void;
  products: Product[];
  posts: ChannelPost[];
  onPublishPost: (post: ChannelPost) => void;
  onLikePost: (postId: string) => void;
  groupMessages: GroupMessage[];
  onSendGroupMessage: (msg: GroupMessage) => void;
  onReactGroupMessage: (msgId: string) => void;
  onTogglePinMessage: (msgId: string) => void;
  liveStreams: LiveStreamState[];
  onUpdateLiveStream: (updated: LiveStreamState) => void;
  onCreateChannel: (channel: StoreChannel) => void;
  onInspectIn3D: (product: Product) => void;
  onAddToCart: (product: Product, finish: ProductFinish) => void;
  onInstantBuy: (product: Product, finish: ProductFinish, discountPercent?: number) => void;
}

export const TelegramChannelsHub: React.FC<TelegramChannelsHubProps> = ({
  channels,
  activeChannelId,
  onSelectChannel,
  products,
  posts,
  onPublishPost,
  onLikePost,
  groupMessages,
  onSendGroupMessage,
  onReactGroupMessage,
  onTogglePinMessage,
  liveStreams,
  onUpdateLiveStream,
  onCreateChannel,
  onInspectIn3D,
  onAddToCart,
  onInstantBuy,
}) => {
  const [folder, setFolder] = useState<'all' | 'channels' | 'groups' | 'live'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'posts' | 'group' | 'tiktok'>('posts');
  const [creatingChannel, setCreatingChannel] = useState(false);

  // Create Channel inputs
  const [newName, setNewName] = useState('');
  const [newOwner, setNewOwner] = useState('');
  const [newCat, setNewCat] = useState('تجارة إلكترونية');
  const [newWallet, setNewWallet] = useState('0x8B20E41F90A24C8156D4A7739E108C45D20A19F2');

  // Channel Post composer
  const [postText, setPostText] = useState('');
  const [postProductId, setPostProductId] = useState('');

  // Group chat composer
  const [groupText, setGroupText] = useState('');
  const [groupRole, setGroupRole] = useState<'customer' | 'merchant'>('customer');
  const [groupProductId, setGroupProductId] = useState('');

  const activeChannel = channels.find((c) => c.id === activeChannelId) || channels[0];
  const channelPosts = posts.filter((p) => p.channelId === activeChannel.id);
  const channelGroupMsgs = groupMessages.filter((m) => m.channelId === activeChannel.id);
  const channelProducts = products.filter((p) => p.channelId === activeChannel.id);
  const channelStream =
    liveStreams.find((s) => s.channelId === activeChannel.id) || liveStreams[0];

  const filteredChannels = channels.filter((ch) => {
    const matchesSearch =
      !searchTerm.trim() ||
      ch.name.includes(searchTerm) ||
      ch.groupName.includes(searchTerm) ||
      ch.category.includes(searchTerm);
    if (!matchesSearch) return false;
    if (folder === 'live') {
      const s = liveStreams.find((ls) => ls.channelId === ch.id);
      return Boolean(s?.isLive);
    }
    return true;
  });

  const handleCreateChannelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newOwner.trim()) return;
    const id = `ch-${Date.now()}`;
    const created: StoreChannel = {
      id,
      name: newName.trim(),
      handle: `@${newName.trim().replace(/\s+/g, '-').slice(0, 14)}`,
      ownerName: newOwner.trim(),
      category: newCat.trim() || 'متجر عام',
      description: 'قناة متجر متصلة بالبلوك تشين مع كروب عملاء وبث تيك توك مباشر.',
      walletAddress: newWallet.trim(),
      verified: true,
      followersCount: 1,
      groupName: `كروب ${newName.trim()}`,
      groupDescription: 'مجموعة تواصل مباشرة مع عملاء المتجر.',
      groupMembersCount: 1,
      tokenGatedGroup: false,
      unreadCount: 0,
    };
    onCreateChannel(created);
    onSelectChannel(created.id);
    setNewName('');
    setNewOwner('');
    setCreatingChannel(false);
  };

  const handlePublishPostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postText.trim() && !postProductId) return;
    onPublishPost({
      id: `cp-${Date.now()}`,
      channelId: activeChannel.id,
      text: postText.trim() || 'إصدار جديد متاح الآن في القناة:',
      productId: postProductId || undefined,
      timestamp: 'الآن',
      viewsCount: 1,
      likesCount: 0,
    });
    setPostText('');
    setPostProductId('');
  };

  const handleSendGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupText.trim() && !groupProductId) return;
    onSendGroupMessage({
      id: `gm-${Date.now()}`,
      channelId: activeChannel.id,
      authorName: groupRole === 'merchant' ? activeChannel.ownerName : 'عضو بالمجموعة',
      authorRole: groupRole,
      text: groupText.trim() || 'مشاركة منتج من المتجر:',
      timestamp: 'الآن',
      attachedProductId: groupProductId || undefined,
      reactions: 0,
      pinned: false,
    });
    setGroupText('');
    setGroupProductId('');
  };

  return (
    <section className="mx-auto max-w-[1440px] p-4 sm:p-6">
      <div className="grid min-h-[calc(100vh-130px)] grid-cols-1 overflow-hidden rounded-2xl border border-[#E1E3E5] bg-white shadow-sm lg:grid-cols-12">
        {/* Right Column (RTL first): Telegram Channel & Group Directory */}
        <aside className="flex flex-col border-b border-[#E1E3E5] bg-[#FAFBFB] lg:col-span-4 lg:border-b-0 lg:border-e">
          <div className="space-y-3 border-b border-[#E1E3E5] p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-base font-bold text-[#202223]">
                القنوات والكروبات
              </h2>
              <button
                type="button"
                onClick={() => setCreatingChannel((prev) => !prev)}
                className="inline-flex items-center gap-1 rounded-lg bg-[#008060] px-2.5 py-1.5 text-xs font-bold text-white hover:bg-[#006E52]"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>قناة جديدة</span>
              </button>
            </div>

            {creatingChannel && (
              <form
                onSubmit={handleCreateChannelSubmit}
                className="space-y-2.5 rounded-xl border border-[#E1E3E5] bg-white p-3"
              >
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="اسم قناة المتجر"
                  className="w-full rounded-lg border border-[#C9CCCF] px-3 py-1.5 text-xs text-[#202223] outline-none focus:border-[#008060]"
                />
                <input
                  type="text"
                  required
                  value={newOwner}
                  onChange={(e) => setNewOwner(e.target.value)}
                  placeholder="اسم التاجر"
                  className="w-full rounded-lg border border-[#C9CCCF] px-3 py-1.5 text-xs text-[#202223] outline-none focus:border-[#008060]"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newCat}
                    onChange={(e) => setNewCat(e.target.value)}
                    placeholder="التصنيف"
                    className="rounded-lg border border-[#C9CCCF] px-2.5 py-1.5 text-xs text-[#202223]"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-[#008060] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#006E52]"
                  >
                    إنشاء
                  </button>
                </div>
              </form>
            )}

            {/* Telegram Search */}
            <div className="relative flex items-center">
              <Search className="pointer-events-none absolute right-3 h-3.5 w-3.5 text-[#6D7175]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="بحث في القنوات والكروبات..."
                className="w-full rounded-lg border border-[#E1E3E5] bg-white py-2 pr-8 pl-3 text-xs text-[#202223] outline-none focus:border-[#008060]"
              />
            </div>

            {/* Telegram Folder Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pt-1 text-xs">
              {(
                [
                  { id: 'all', label: 'الكل' },
                  { id: 'channels', label: 'القنوات' },
                  { id: 'groups', label: 'الكروبات' },
                  { id: 'live', label: 'لايف الآن' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setFolder(tab.id);
                    if (tab.id === 'groups') setActiveTab('group');
                    else if (tab.id === 'channels') setActiveTab('posts');
                    else if (tab.id === 'live') setActiveTab('tiktok');
                  }}
                  className={`rounded-lg px-2.5 py-1 font-semibold transition-colors whitespace-nowrap ${
                    folder === tab.id
                      ? 'bg-[#EBF5F2] text-[#008060]'
                      : 'text-[#6D7175] hover:bg-[#EBEDEF]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Telegram Channel / Group List */}
          <div className="flex-1 divide-y divide-[#F1F2F4] overflow-y-auto">
            {filteredChannels.map((ch) => {
              const isSelected = ch.id === activeChannel.id;
              const chLive = liveStreams.find((s) => s.channelId === ch.id);
              const isGroupView = folder === 'groups';

              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => onSelectChannel(ch.id)}
                  className={`flex w-full items-center gap-3 p-3.5 text-start transition-colors ${
                    isSelected ? 'bg-[#EBF5F2]' : 'hover:bg-[#F1F2F4]'
                  }`}
                >
                  <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1A1A1A] font-display text-sm font-bold text-white">
                    {ch.name.slice(0, 1)}
                    {chLive?.isLive && (
                      <span
                        title="بث مباشر"
                        className="absolute -bottom-0.5 -left-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#FE2C55] text-white"
                      >
                        <Radio className="h-2.5 w-2.5" />
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {isGroupView ? (
                          <Users className="h-3.5 w-3.5 shrink-0 text-[#008060]" />
                        ) : (
                          <Megaphone className="h-3.5 w-3.5 shrink-0 text-[#008060]" />
                        )}
                        <span className="truncate text-sm font-bold text-[#202223]">
                          {isGroupView ? ch.groupName : ch.name}
                        </span>
                      </div>
                      {ch.unreadCount > 0 && (
                        <span className="rounded-full bg-[#008060] px-1.5 py-0.5 font-mono-data text-[10px] font-bold text-white">
                          {ch.unreadCount}
                        </span>
                      )}
                    </div>

                    <div className="mt-0.5 flex items-center justify-between gap-2 text-xs text-[#6D7175]">
                      <span className="truncate">
                        {isGroupView ? ch.groupDescription : ch.description}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Left Column (Main Pane): Active Telegram Channel / Group / TikTok Live */}
        <div className="flex flex-col bg-[#F6F6F7] lg:col-span-8">
          {/* Channel Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E1E3E5] bg-white px-5 py-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1A1A1A] font-display text-sm font-bold text-white">
                {activeChannel.name.slice(0, 1)}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-display text-base font-bold text-[#202223]">
                    {activeTab === 'group' ? activeChannel.groupName : activeChannel.name}
                  </h3>
                  {activeChannel.verified && (
                    <Check className="h-4 w-4 text-[#008060]" aria-label="قناة موثقة" />
                  )}
                </div>
                <div className="text-xs text-[#6D7175]">
                  {activeTab === 'group'
                    ? `${activeChannel.groupMembersCount.toLocaleString()} عضو في الكروب`
                    : `${activeChannel.followersCount.toLocaleString()} مشترك في القناة`}
                  {activeChannel.connectedPlatform && ` · مربوط بـ ${activeChannel.connectedPlatform}`}
                </div>
              </div>
            </div>

            {/* Channel Inner Switcher: Posts | Group | TikTok Live (All inside the same channel!) */}
            <div className="flex items-center gap-1 rounded-xl border border-[#E1E3E5] bg-[#F6F6F7] p-1">
              <button
                type="button"
                onClick={() => setActiveTab('posts')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  activeTab === 'posts'
                    ? 'bg-white text-[#202223] shadow-sm'
                    : 'text-[#6D7175] hover:text-[#202223]'
                }`}
              >
                <Megaphone className="h-3.5 w-3.5 text-[#008060]" />
                <span>القناة</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('group')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  activeTab === 'group'
                    ? 'bg-white text-[#202223] shadow-sm'
                    : 'text-[#6D7175] hover:text-[#202223]'
                }`}
              >
                <Users className="h-3.5 w-3.5 text-[#008060]" />
                <span>الكروب</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('tiktok')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  activeTab === 'tiktok'
                    ? 'bg-[#1A1A1A] text-white shadow-sm'
                    : 'text-[#6D7175] hover:text-[#202223]'
                }`}
              >
                <Clapperboard
                  className={`h-3.5 w-3.5 ${
                    channelStream.isLive ? 'text-[#FE2C55]' : 'text-[#6D7175]'
                  }`}
                />
                <span>بث تيك توك</span>
              </button>
            </div>
          </div>

          {/* Telegram Pinned Live Banner inside Channel Posts & Group */}
          {channelStream.isLive && activeTab !== 'tiktok' && (
            <div className="flex items-center justify-between gap-3 border-b border-[#E1E3E5] bg-[#EBF5F2] px-5 py-2.5 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <Radio className="h-4 w-4 shrink-0 text-[#FE2C55]" />
                <span className="truncate font-semibold text-[#202223]">
                  بث تيك توك مباشر الآن: {channelStream.title}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('tiktok')}
                className="shrink-0 rounded-lg bg-[#008060] px-3 py-1 text-xs font-bold text-white hover:bg-[#006E52]"
              >
                مشاهدة البث
              </button>
            </div>
          )}

          {/* TAB 1: TELEGRAM CHANNEL POSTS */}
          {activeTab === 'posts' && (
            <div className="flex flex-1 flex-col justify-between">
              <div className="max-h-[540px] flex-1 space-y-4 overflow-y-auto p-5">
                {channelPosts.map((post) => {
                  const linkedProd = post.productId
                    ? products.find((p) => p.id === post.productId)
                    : undefined;

                  return (
                    <article
                      key={post.id}
                      className="max-w-2xl rounded-2xl border border-[#E1E3E5] bg-white p-4 shadow-xs"
                    >
                      <div className="flex items-center justify-between text-xs text-[#6D7175]">
                        <span className="font-bold text-[#008060]">{activeChannel.name}</span>
                        <span>{post.timestamp}</span>
                      </div>

                      <p className="mt-2 text-sm leading-relaxed text-[#202223]">{post.text}</p>

                      {linkedProd && (
                        <div className="mt-3 overflow-hidden rounded-xl border border-[#E1E3E5] bg-[#FAFBFB]">
                          <div className="grid grid-cols-1 sm:grid-cols-12">
                            <img
                              src={linkedProd.image}
                              alt={linkedProd.title}
                              referrerPolicy="no-referrer"
                              className="h-36 w-full object-cover sm:col-span-4"
                            />
                            <div className="flex flex-col justify-between p-3.5 sm:col-span-8">
                              <div>
                                <div className="text-xs text-[#6D7175]">
                                  {linkedProd.category} · متوفر {linkedProd.stock}
                                </div>
                                <h4 className="mt-0.5 font-display text-sm font-bold text-[#202223]">
                                  {linkedProd.title}
                                </h4>
                                <div className="mt-1 font-mono-data text-base font-bold text-[#008060]">
                                  {linkedProd.priceUSDC.toLocaleString()} USDC
                                </div>
                              </div>

                              <div className="mt-3 flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => onInstantBuy(linkedProd, linkedProd.finish)}
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#008060] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#006E52]"
                                >
                                  <ShoppingBag className="h-3.5 w-3.5" />
                                  <span>شراء بالبلوك تشين</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onInspectIn3D(linkedProd)}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#C9CCCF] bg-white px-3 py-1.5 text-xs font-semibold text-[#202223] hover:bg-[#F6F6F7]"
                                >
                                  <Box className="h-3.5 w-3.5" />
                                  <span>معاينة 3D</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onAddToCart(linkedProd, linkedProd.finish)}
                                  className="rounded-lg border border-[#C9CCCF] bg-white px-2.5 py-1.5 text-xs text-[#6D7175] hover:text-[#202223]"
                                >
                                  + سلة
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="mt-3 flex items-center justify-between border-t border-[#F1F2F4] pt-2.5 text-xs text-[#6D7175]">
                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            onClick={() => onLikePost(post.id)}
                            className="inline-flex items-center gap-1 hover:text-[#FE2C55]"
                          >
                            <Heart className="h-3.5 w-3.5" />
                            <span className="tabular-nums">{post.likesCount}</span>
                          </button>
                          <span className="inline-flex items-center gap-1 tabular-nums">
                            <Eye className="h-3.5 w-3.5" />
                            <span>{post.viewsCount.toLocaleString()}</span>
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab('group')}
                          className="font-semibold text-[#008060] hover:underline"
                        >
                          مناقشة في الكروب
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Channel Post Publisher (Merchant Broadcast) */}
              <form
                onSubmit={handlePublishPostSubmit}
                className="border-t border-[#E1E3E5] bg-white p-4"
              >
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#202223]">
                    نشر في قناة {activeChannel.name}
                  </span>
                  <select
                    value={postProductId}
                    onChange={(e) => setPostProductId(e.target.value)}
                    className="rounded-lg border border-[#C9CCCF] bg-white px-2.5 py-1 text-xs text-[#202223]"
                  >
                    <option value="">بدون منتج مرفق</option>
                    {(channelProducts.length > 0 ? channelProducts : products).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={postText}
                    onChange={(e) => setPostText(e.target.value)}
                    placeholder="اكتب منشوراً أو عرضاً لمشتركي القناة..."
                    className="flex-1 rounded-xl border border-[#C9CCCF] bg-[#F6F6F7] px-3.5 py-2 text-xs text-[#202223] outline-none focus:border-[#008060] focus:bg-white"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#008060] px-4 py-2 text-xs font-bold text-white hover:bg-[#006E52]"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>نشر</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: TELEGRAM LINKED STORE GROUP */}
          {activeTab === 'group' && (
            <div className="flex flex-1 flex-col justify-between">
              <div className="max-h-[540px] flex-1 space-y-3 overflow-y-auto p-5">
                {channelGroupMsgs.map((msg) => {
                  const isMerchant = msg.authorRole === 'merchant';
                  const attached = msg.attachedProductId
                    ? products.find((p) => p.id === msg.attachedProductId)
                    : undefined;

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMerchant ? 'items-start' : 'items-end'}`}
                    >
                      <div
                        className={`max-w-lg rounded-2xl border p-3.5 text-sm shadow-xs ${
                          isMerchant
                            ? 'border-[#C7E6DC] bg-[#EBF5F2] text-[#202223]'
                            : 'border-[#E1E3E5] bg-white text-[#202223]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4 text-xs">
                          <span className="font-bold text-[#008060]">
                            {msg.authorName} {isMerchant ? '· التاجر' : ''}
                          </span>
                          <div className="flex items-center gap-2 text-[#6D7175]">
                            <span>{msg.timestamp}</span>
                            <button
                              type="button"
                              onClick={() => onTogglePinMessage(msg.id)}
                              className={msg.pinned ? 'text-[#008060]' : 'hover:text-[#202223]'}
                              aria-label="تثبيت"
                            >
                              <Pin className="h-3 w-3" />
                            </button>
                          </div>
                        </div>

                        <p className="mt-1.5 text-xs leading-relaxed">{msg.text}</p>

                        {attached && (
                          <div className="mt-2.5 flex items-center justify-between gap-3 rounded-xl border border-[#E1E3E5] bg-white p-2.5">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={attached.image}
                                alt={attached.title}
                                referrerPolicy="no-referrer"
                                className="h-10 w-12 shrink-0 rounded-lg object-cover"
                              />
                              <div className="min-w-0">
                                <div className="truncate text-xs font-bold">{attached.title}</div>
                                <div className="font-mono-data text-xs font-bold text-[#008060]">
                                  {attached.priceUSDC} USDC
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => onInstantBuy(attached, attached.finish)}
                              className="shrink-0 rounded-lg bg-[#008060] px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-[#006E52]"
                            >
                              شراء
                            </button>
                          </div>
                        )}

                        <div className="mt-2 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onReactGroupMessage(msg.id)}
                            className="inline-flex items-center gap-1 text-[11px] text-[#6D7175] hover:text-[#008060]"
                          >
                            <ThumbsUp className="h-3 w-3" />
                            <span className="tabular-nums">{msg.reactions}</span>
                          </button>
                          {msg.pinned && <span className="text-[10px] font-semibold text-[#008060]">مثبت</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <form
                onSubmit={handleSendGroupSubmit}
                className="border-t border-[#E1E3E5] bg-white p-4"
              >
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1 rounded-lg border border-[#E1E3E5] bg-[#F6F6F7] p-0.5">
                    <button
                      type="button"
                      onClick={() => setGroupRole('customer')}
                      className={`rounded-md px-2.5 py-1 font-semibold ${
                        groupRole === 'customer' ? 'bg-white text-[#202223] shadow-xs' : 'text-[#6D7175]'
                      }`}
                    >
                      العميل
                    </button>
                    <button
                      type="button"
                      onClick={() => setGroupRole('merchant')}
                      className={`rounded-md px-2.5 py-1 font-semibold ${
                        groupRole === 'merchant' ? 'bg-[#008060] text-white' : 'text-[#6D7175]'
                      }`}
                    >
                      التاجر
                    </button>
                  </div>

                  <select
                    value={groupProductId}
                    onChange={(e) => setGroupProductId(e.target.value)}
                    className="rounded-lg border border-[#C9CCCF] bg-white px-2.5 py-1 text-xs text-[#202223]"
                  >
                    <option value="">إرفاق منتج بالكروب</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={groupText}
                    onChange={(e) => setGroupText(e.target.value)}
                    placeholder={`رسالة في ${activeChannel.groupName}...`}
                    className="flex-1 rounded-xl border border-[#C9CCCF] bg-[#F6F6F7] px-3.5 py-2 text-xs text-[#202223] outline-none focus:border-[#008060] focus:bg-white"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#008060] px-4 py-2 text-xs font-bold text-white hover:bg-[#006E52]"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>إرسال</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: TIKTOK LIVE STREAM INSIDE THE SAME CHANNEL */}
          {activeTab === 'tiktok' && (
            <div className="flex-1 overflow-y-auto p-6">
              <TikTokLivePlayer
                stream={channelStream}
                channel={activeChannel}
                products={products}
                onUpdateStream={onUpdateLiveStream}
                onInspectIn3D={onInspectIn3D}
                onInstantBuy={onInstantBuy}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
