import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Camera,
  CameraOff,
  CheckCircle2,
  Eye,
  Flame,
  Heart,
  MessageSquare,
  Radio,
  Send,
  Share2,
  ShoppingBag,
  ThumbsUp,
  Users,
} from 'lucide-react';
import { STUDIO_LIVE_BACKDROP } from '../data/initialData';
import { UI_COPY } from '../i18n/translations';
import { ChannelPost, Language, Product, StoreChannel } from '../types/commerce';
import { localizeTimestamp } from '../utils/commerceLogic';

interface ChannelPostCardProps {
  lang: Language;
  post: ChannelPost;
  channel?: StoreChannel;
  product?: Product;
  onOpenChannel?: (channelId: string) => void;
  onOpenProduct: (product: Product, mode?: 'images' | '3d') => void;
  onAddToCart: (product: Product) => void;
  onReact: (postId: string, key: 'heart' | 'thumbs' | 'fire') => void;
  onAddComment: (postId: string, text: string) => void;
  onSendLiveChat?: (postId: string, text: string) => void;
  onToggleLiveStatus?: (postId: string, liveActive: boolean, hasReplay: boolean) => void;
}

export const ChannelPostCard: React.FC<ChannelPostCardProps> = ({
  lang,
  post,
  channel,
  product,
  onOpenChannel,
  onOpenProduct,
  onAddToCart,
  onReact,
  onAddComment,
  onSendLiveChat,
  onToggleLiveStatus,
}) => {
  const t = UI_COPY[lang];
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [liveMessage, setLiveMessage] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [copied, setCopied] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((tr) => tr.stop());
      }
    };
  }, []);

  const toggleLiveCamera = async () => {
    if (cameraActive) {
      mediaStreamRef.current?.getTracks().forEach((tr) => tr.stop());
      mediaStreamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      setCameraActive(false);
      setCameraError('');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(
        lang === 'ar' ? 'الكاميرا غير مدعومة في هذا المتصفح' : 'Camera unavailable in this browser'
      );
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      mediaStreamRef.current = stream;
      setCameraActive(true);
      setCameraError('');
      requestAnimationFrame(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      });
    } catch {
      setCameraError(
        lang === 'ar' ? 'تعذر الوصول للكاميرا — مستمر في عرض الاستوديو' : 'Camera permission denied'
      );
    }
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(post.id, commentText.trim());
    setCommentText('');
  };

  const handleLiveChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveMessage.trim() || !onSendLiveChat) return;
    onSendLiveChat(post.id, liveMessage.trim());
    setLiveMessage('');
  };

  const handleShare = () => {
    const shareText = `${channel ? (lang === 'ar' ? channel.name : channel.nameEn) : 'Store-21'} — ${
      lang === 'ar' ? post.text : post.textEn
    }`;
    navigator.clipboard?.writeText(shareText).catch(() => undefined);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const channelName = channel ? (lang === 'ar' ? channel.name : channel.nameEn) : 'Store-21';
  const isLiveRunning = post.type === 'live' && post.liveActive !== false;

  return (
    <article className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white">
      {/* Post Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4 pb-3">
        <button
          type="button"
          onClick={() => channel && onOpenChannel?.(channel.id)}
          className="flex min-w-0 items-center gap-3 text-start"
        >
          <img
            src={channel?.avatarImage || STUDIO_LIVE_BACKDROP}
            alt={channelName}
            referrerPolicy="no-referrer"
            className="h-10 w-10 shrink-0 rounded-full border border-[#E5E7EB] object-cover"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-sm font-bold text-[#141518]">{channelName}</span>
              {channel?.verified && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#059669]" />}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
              <span>{localizeTimestamp(post.timestamp, lang)}</span>
              {product?.syncedFrom && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="capitalize">{product.syncedFrom}</span>
                </>
              )}
            </div>
          </div>
        </button>

        {post.type === 'live' && (
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold tabular-nums">
            {isLiveRunning ? (
              <span className="inline-flex items-center gap-1 text-[#DC2626]">
                <Radio className="h-3.5 w-3.5" />
                <span>{t.common.live}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded bg-[#F3F4F6] px-2 py-0.5 text-[#4B5563]">
                {post.hasReplay ? t.common.replay : lang === 'ar' ? 'بث منتهٍ' : 'Ended'}
              </span>
            )}
            <span className="text-[#6B7280]">·</span>
            <span className="inline-flex items-center gap-1 text-[#141518]">
              <Users className="h-3.5 w-3.5 text-[#6B7280]" />
              {(post.liveViewerCount || 0).toLocaleString()}
            </span>
            {onToggleLiveStatus && (
              <button
                type="button"
                onClick={() =>
                  onToggleLiveStatus(post.id, !isLiveRunning, isLiveRunning ? true : Boolean(post.hasReplay))
                }
                className="rounded-lg border border-[#E5E7EB] bg-[#F8F9FA] px-2.5 py-1 text-[11px] font-semibold text-[#141518] hover:border-[#059669] whitespace-nowrap"
              >
                {isLiveRunning
                  ? lang === 'ar'
                    ? 'إنهاء وحفظ الإعادة'
                    : 'End & Save Replay'
                  : lang === 'ar'
                  ? 'إعادة تفعيل البث'
                  : 'Go Live'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Post Copy */}
      <div className="px-5 pb-3">
        <p className="text-sm leading-relaxed text-[#1F2937]">
          {lang === 'ar' ? post.text : post.textEn}
        </p>
      </div>

      {/* LIVE POST BODY */}
      {post.type === 'live' && (
        <div className="px-5 pb-4">
          <div className="grid grid-cols-1 overflow-hidden rounded-xl border border-[#E5E7EB] bg-[#141518] lg:grid-cols-12">
            <div className="relative aspect-video lg:col-span-7">
              {cameraActive ? (
                <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
              ) : (
                <img
                  src={STUDIO_LIVE_BACKDROP}
                  alt={lang === 'ar' ? post.liveTitle : post.liveTitleEn}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              )}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-3 text-xs text-white">
                <span className="truncate font-semibold">
                  {lang === 'ar' ? post.liveTitle : post.liveTitleEn}
                </span>
                <button
                  type="button"
                  onClick={toggleLiveCamera}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-black/60 px-2.5 py-1.5 text-[11px] font-semibold hover:bg-[#059669]"
                >
                  {cameraActive ? <CameraOff className="h-3.5 w-3.5" /> : <Camera className="h-3.5 w-3.5" />}
                  <span>{cameraActive ? (lang === 'ar' ? 'إيقاف الكاميرا' : 'Stop Cam') : (lang === 'ar' ? 'كاميرا البث' : 'Test Cam')}</span>
                </button>
              </div>
            </div>

            {/* Live Chat Column */}
            <div className="flex flex-col justify-between bg-white lg:col-span-5 lg:border-s lg:border-[#E5E7EB]">
              <div className="border-b border-[#E5E7EB] px-4 py-2.5 text-xs font-bold text-[#141518]">
                {lang === 'ar' ? 'محادثة البث المباشر' : 'Live Chat'}
              </div>
              {cameraError && (
                <div className="border-b border-[#E5E7EB] bg-[#F8F9FA] px-4 py-1.5 text-[11px] text-[#6B7280]">
                  {cameraError}
                </div>
              )}
              <div className="max-h-44 flex-1 space-y-2 overflow-y-auto p-3 text-xs">
                {(post.liveChat || []).map((msg) => (
                  <div key={msg.id}>
                    <span className={msg.role === 'seller' ? 'font-bold text-[#059669]' : 'font-semibold text-[#141518]'}>
                      {msg.sender}:{' '}
                    </span>
                    <span className="text-[#4B5563]">{msg.text}</span>
                  </div>
                ))}
              </div>
              {onSendLiveChat && (
                <form onSubmit={handleLiveChatSubmit} className="flex items-center gap-1.5 border-t border-[#E5E7EB] p-2.5">
                  <input
                    type="text"
                    value={liveMessage}
                    onChange={(e) => setLiveMessage(e.target.value)}
                    placeholder={lang === 'ar' ? 'اكتب تعليقاً في البث...' : 'Join live chat...'}
                    className="min-w-0 flex-1 rounded-lg border border-[#D1D5DB] bg-[#F8F9FA] px-2.5 py-1.5 text-xs text-[#141518] outline-none focus:border-[#059669] focus:bg-white"
                  />
                  <button
                    type="submit"
                    aria-label={t.common.send}
                    className="shrink-0 rounded-lg bg-[#059669] p-1.5 text-white hover:bg-[#047857]"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Linked Pinned Product inside Live Post */}
          {product && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] px-4 py-2.5">
              <div className="flex min-w-0 items-center gap-3">
                <img
                  src={product.image}
                  alt={lang === 'ar' ? product.title : product.titleEn}
                  referrerPolicy="no-referrer"
                  className="h-10 w-12 shrink-0 rounded object-cover"
                />
                <div className="min-w-0">
                  <div className="truncate text-xs font-bold text-[#141518]">
                    {lang === 'ar' ? product.title : product.titleEn}
                  </div>
                  <div className="font-mono-data text-xs font-semibold text-[#059669]">
                    ${product.priceUSD.toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenProduct(product, 'images')}
                  className="rounded-lg border border-[#D1D5DB] bg-white px-3 py-1.5 text-xs font-semibold text-[#141518] hover:border-[#141518] whitespace-nowrap"
                >
                  {lang === 'ar' ? 'التفاصيل' : 'Details'}
                </button>
                <button
                  type="button"
                  onClick={() => onAddToCart(product)}
                  className="rounded-lg bg-[#059669] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#047857] whitespace-nowrap"
                >
                  {t.common.orderNow}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PRODUCT POST BODY */}
      {post.type === 'product' && product && (
        <div className="px-5 pb-4">
          <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-[#F8F9FA]">
            <div className="grid grid-cols-1 sm:grid-cols-12">
              <button
                type="button"
                onClick={() => onOpenProduct(product, 'images')}
                className="aspect-[4/3] w-full overflow-hidden bg-[#F3F4F6] sm:col-span-5"
              >
                <img
                  src={product.image}
                  alt={lang === 'ar' ? product.title : product.titleEn}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover transition-transform duration-200 hover:scale-[1.02]"
                />
              </button>

              <div className="flex flex-col justify-between p-4 sm:col-span-7">
                <div>
                  <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                    <span>{lang === 'ar' ? product.category : product.categoryEn}</span>
                    <span aria-hidden="true">·</span>
                    <span className={product.stock > 0 ? 'text-[#059669]' : 'text-[#DC2626]'}>
                      {product.stock > 0 ? t.common.inStock : t.common.outOfStock}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenProduct(product, 'images')}
                    className="mt-1.5 text-start font-display text-base font-bold text-[#141518] hover:text-[#059669]"
                  >
                    {lang === 'ar' ? product.title : product.titleEn}
                  </button>

                  <div className="mt-2 flex items-baseline gap-2.5">
                    <span className="font-mono-data text-xl font-bold text-[#059669]">
                      ${product.priceUSD.toLocaleString()}
                    </span>
                    {product.compareAtPriceUSD && product.compareAtPriceUSD > product.priceUSD && (
                      <span className="font-mono-data text-xs text-[#9CA3AF] line-through">
                        ${product.compareAtPriceUSD.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={product.stock === 0}
                    onClick={() => onAddToCart(product)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#059669] px-4 py-2 text-xs font-semibold text-white hover:bg-[#047857] disabled:opacity-40 whitespace-nowrap"
                  >
                    <ShoppingBag className="h-3.5 w-3.5" />
                    <span>{t.common.addToCart}</span>
                  </button>

                  {(product.has3D || product.model3dUrl) && (
                    <button
                      type="button"
                      onClick={() => onOpenProduct(product, '3d')}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#D1D5DB] bg-white px-3.5 py-2 text-xs font-semibold text-[#141518] hover:border-[#059669] hover:text-[#059669] whitespace-nowrap"
                    >
                      <Box className="h-3.5 w-3.5 text-[#059669]" />
                      <span>{t.common.inspect3D}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onOpenProduct(product, 'images')}
                    className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-xs font-semibold text-[#4B5563] hover:text-[#141518] whitespace-nowrap"
                  >
                    {lang === 'ar' ? 'التفاصيل' : 'Details'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ANNOUNCEMENT / NORMAL POST IMAGE OR VIDEO */}
      {post.type === 'announcement' && (post.videoUrl || post.image || product) && (
        <div className="px-5 pb-4">
          {post.videoUrl && (
            <div className="mb-3 overflow-hidden rounded-xl border border-[#E5E7EB] bg-[#141518]">
              <video src={post.videoUrl} controls className="max-h-80 w-full" />
            </div>
          )}
          {post.image && (
            <div className="aspect-[16/9] w-full overflow-hidden rounded-xl border border-[#E5E7EB] bg-[#F3F4F6]">
              <img
                src={post.image}
                alt={channelName}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
            </div>
          )}
          {product && (
            <button
              type="button"
              onClick={() => onOpenProduct(product, 'images')}
              className="mt-3 flex w-full items-center justify-between rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] px-4 py-2.5 text-start hover:border-[#059669]"
            >
              <span className="truncate text-xs font-bold text-[#141518]">
                {lang === 'ar' ? product.title : product.titleEn}
              </span>
              <span className="font-mono-data text-xs font-semibold text-[#059669]">
                ${product.priceUSD.toLocaleString()}
              </span>
            </button>
          )}
        </div>
      )}

      {/* Footer Actions: Reactions, Comments, Share */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#F3F4F6] px-5 py-3 text-xs text-[#6B7280]">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => onReact(post.id, 'heart')}
            className="inline-flex items-center gap-1 hover:text-[#DC2626] tabular-nums"
          >
            <Heart className="h-3.5 w-3.5 text-[#EF4444]" />
            <span>{post.reactions.heart.toLocaleString()}</span>
          </button>
          <button
            type="button"
            onClick={() => onReact(post.id, 'thumbs')}
            className="inline-flex items-center gap-1 hover:text-[#059669] tabular-nums"
          >
            <ThumbsUp className="h-3.5 w-3.5 text-[#D97706]" />
            <span>{post.reactions.thumbs.toLocaleString()}</span>
          </button>
          <button
            type="button"
            onClick={() => onReact(post.id, 'fire')}
            className="inline-flex items-center gap-1 hover:text-[#EA580C] tabular-nums"
          >
            <Flame className="h-3.5 w-3.5 text-[#F97316]" />
            <span>{post.reactions.fire.toLocaleString()}</span>
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1 hover:text-[#141518]"
          >
            <Share2 className="h-3.5 w-3.5" />
            {copied && <span className="text-[#059669]">{lang === 'ar' ? 'نُسخ' : 'Copied'}</span>}
          </button>
        </div>

        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1 tabular-nums">
            <Eye className="h-3.5 w-3.5" />
            <span>{post.viewsCount.toLocaleString()}</span>
          </span>
          <button
            type="button"
            onClick={() => setCommentsOpen((prev) => !prev)}
            className="inline-flex items-center gap-1 font-medium text-[#4B5563] hover:text-[#059669] tabular-nums"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>
              {post.comments.length} {t.common.comments}
            </span>
          </button>
        </div>
      </div>

      {/* Expandable Comments Section */}
      {commentsOpen && (
        <div className="border-t border-[#E5E7EB] bg-[#F8F9FA] px-5 py-4">
          {post.comments.length > 0 ? (
            <div className="mb-3 space-y-2.5">
              {post.comments.map((c) => (
                <div key={c.id} className="rounded-lg border border-[#E5E7EB] bg-white px-3.5 py-2 text-xs">
                  <div className="flex items-center justify-between text-[#6B7280]">
                    <span className="font-bold text-[#141518]">{c.author}</span>
                    <span>{c.timestamp}</span>
                  </div>
                  <p className="mt-1 text-[#374151]">{c.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mb-3 text-xs text-[#6B7280]">
              {lang === 'ar' ? 'لا توجد تعليقات بعد.' : 'No comments yet.'}
            </p>
          )}
          <form onSubmit={handleCommentSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={lang === 'ar' ? 'أضف تعليقاً...' : 'Write a comment...'}
              className="flex-1 rounded-lg border border-[#D1D5DB] bg-white px-3 py-1.5 text-xs text-[#141518] outline-none focus:border-[#059669]"
            />
            <button
              type="submit"
              className="rounded-lg bg-[#141518] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#27292E]"
            >
              {t.common.send}
            </button>
          </form>
        </div>
      )}
    </article>
  );
};
