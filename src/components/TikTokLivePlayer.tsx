import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Camera,
  CameraOff,
  ChevronDown,
  ChevronUp,
  Heart,
  Radio,
  Send,
  ShoppingBag,
  SlidersHorizontal,
  Users,
} from 'lucide-react';
import { STUDIO_LIVE_BACKDROP } from '../data/initialData';
import { LiveStreamState, Product, ProductFinish, StoreChannel } from '../types/commerce';

interface TikTokLivePlayerProps {
  stream: LiveStreamState;
  channel: StoreChannel;
  products: Product[];
  onUpdateStream: (updated: LiveStreamState) => void;
  onInspectIn3D: (product: Product) => void;
  onInstantBuy: (product: Product, finish: ProductFinish, discountPercent?: number) => void;
  onPrevStream?: () => void;
  onNextStream?: () => void;
  streamIndexLabel?: string;
}

export const TikTokLivePlayer: React.FC<TikTokLivePlayerProps> = ({
  stream,
  channel,
  products,
  onUpdateStream,
  onInspectIn3D,
  onInstantBuy,
  onPrevStream,
  onNextStream,
  streamIndexLabel,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRef = useRef<MediaStream | null>(null);

  const [studioOpen, setStudioOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [senderRole, setSenderRole] = useState<'viewer' | 'merchant'>('viewer');
  const [cameraMsg, setCameraMsg] = useState('');

  const channelProducts = products.filter((p) => p.channelId === channel.id);
  const pool = channelProducts.length > 0 ? channelProducts : products;
  const pinnedProduct = products.find((p) => p.id === stream.pinnedProductId) || pool[0];

  const discountedPrice = pinnedProduct
    ? Math.round(pinnedProduct.priceUSDC * (1 - stream.flashDiscountPercent / 100))
    : 0;

  const stopCamera = () => {
    if (mediaRef.current) {
      mediaRef.current.getTracks().forEach((t) => t.stop());
      mediaRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, [stream.id]);

  const handleToggleWebcam = async () => {
    if (stream.useWebcam) {
      stopCamera();
      onUpdateStream({ ...stream, useWebcam: false });
      setCameraMsg('');
      return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraMsg('المتصفح لا يدعم الكاميرا؛ يعمل البث بوضع الاستوديو.');
      return;
    }
    try {
      const media = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      mediaRef.current = media;
      setCameraMsg('');
      onUpdateStream({ ...stream, useWebcam: true, isLive: true });
      requestAnimationFrame(() => {
        if (videoRef.current) videoRef.current.srcObject = media;
      });
    } catch {
      setCameraMsg('تعذر الوصول للكاميرا؛ تم استخدام خلفية الاستوديو.');
      onUpdateStream({ ...stream, useWebcam: false });
    }
  };

  const handleToggleLive = () => {
    if (stream.isLive) {
      stopCamera();
      onUpdateStream({ ...stream, isLive: false, useWebcam: false });
    } else {
      onUpdateStream({
        ...stream,
        isLive: true,
        startedAt: 'بدأ للتو',
        viewerCount: Math.max(stream.viewerCount, 140),
      });
    }
  };

  const handleLike = () => {
    onUpdateStream({ ...stream, likesCount: stream.likesCount + 1 });
  };

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onUpdateStream({
      ...stream,
      chatMessages: [
        ...stream.chatMessages,
        {
          id: `tk-${Date.now()}`,
          sender: senderRole === 'merchant' ? channel.ownerName : 'متابع',
          role: senderRole,
          text: commentText.trim(),
          timestamp: 'الآن',
        },
      ],
    });
    setCommentText('');
  };

  return (
    <div className="flex flex-col items-center justify-center gap-6 lg:flex-row lg:items-start">
      {/* Vertical 9:16 TikTok Live Frame */}
      <div className="relative aspect-[9/16] w-full max-w-[385px] overflow-hidden rounded-3xl border border-[#E1E3E5] bg-[#0B0D12] shadow-xl">
        {/* Video or Studio Background */}
        {stream.useWebcam ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
          />
        ) : (
          <img
            src={STUDIO_LIVE_BACKDROP}
            alt={stream.title}
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
        )}

        {/* Top & Bottom Contrast Scrims */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/75 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-black/90 via-black/55 to-transparent" />

        {/* TikTok Top Overlay: Host Pill + Viewer Counter */}
        <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 p-4">
          <div className="flex items-center gap-2.5 rounded-full bg-black/55 py-1 pr-1.5 pl-3 text-white">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#008060] text-xs font-bold">
              {channel.name.slice(0, 1)}
            </div>
            <div className="min-w-0">
              <div className="max-w-[130px] truncate text-xs font-bold">{channel.name}</div>
              <div className="text-[10px] text-white/75">{stream.hostName}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white">
              <Radio className={`h-3 w-3 ${stream.isLive ? 'text-[#FE2C55]' : 'text-white/50'}`} />
              <span>{stream.isLive ? 'مباشر' : 'متوقف'}</span>
            </div>
            <div className="inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[11px] text-white tabular-nums">
              <Users className="h-3 w-3" />
              <span>{stream.viewerCount}</span>
            </div>
          </div>
        </div>

        {/* TikTok Side Floating Action Stack (Left side in RTL) */}
        <div className="absolute left-3 bottom-48 flex flex-col items-center gap-3.5 text-white">
          <button
            type="button"
            onClick={handleLike}
            className="flex flex-col items-center gap-0.5"
            aria-label="إعجاب بالبث"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/55 transition-transform active:scale-90 hover:bg-[#FE2C55]">
              <Heart className="h-5 w-5" />
            </div>
            <span className="font-mono-data text-[11px]">{stream.likesCount}</span>
          </button>

          {pinnedProduct && (
            <button
              type="button"
              onClick={() => onInspectIn3D(pinnedProduct)}
              className="flex flex-col items-center gap-0.5"
              aria-label="معاينة 3D"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/55 hover:bg-[#008060]">
                <Box className="h-5 w-5" />
              </div>
              <span className="text-[10px]">3D</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setStudioOpen((prev) => !prev)}
            className="flex flex-col items-center gap-0.5"
            aria-label="إعدادات المذيع"
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                studioOpen ? 'bg-[#008060]' : 'bg-black/55 hover:bg-black/75'
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
            </div>
            <span className="text-[10px]">بث</span>
          </button>

          {onPrevStream && onNextStream && (
            <div className="mt-1 flex flex-col items-center gap-1.5">
              <button
                type="button"
                onClick={onPrevStream}
                aria-label="البث السابق"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-black/55 hover:bg-black/80"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              {streamIndexLabel && (
                <span className="font-mono-data text-[10px] text-white/75">{streamIndexLabel}</span>
              )}
              <button
                type="button"
                onClick={onNextStream}
                aria-label="البث التالي"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-black/55 hover:bg-black/80"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* TikTok Bottom Area: Live Comments + Pinned Product Card + Comment Input */}
        <div className="absolute inset-x-0 bottom-0 space-y-2.5 p-3.5">
          {/* Stream Title */}
          <div className="pl-12 text-xs font-medium text-white/95 line-clamp-1">{stream.title}</div>

          {/* Scrolling Live Chat Bubbles */}
          <div className="max-h-24 space-y-1.5 overflow-y-auto pl-12">
            {stream.chatMessages.slice(-4).map((msg) => (
              <div
                key={msg.id}
                className="inline-block max-w-full rounded-xl bg-black/45 px-2.5 py-1 text-[11px] text-white"
              >
                <span
                  className={`font-bold ${
                    msg.role === 'merchant' ? 'text-[#5EEAD4]' : 'text-[#FDE047]'
                  }`}
                >
                  {msg.sender}:{' '}
                </span>
                <span>{msg.text}</span>
              </div>
            ))}
          </div>

          {/* TikTok Shop Pinned Product Card */}
          {pinnedProduct && (
            <div className="flex items-center justify-between gap-2.5 rounded-2xl bg-white p-2.5 text-[#202223] shadow-lg">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={pinnedProduct.image}
                  alt={pinnedProduct.title}
                  referrerPolicy="no-referrer"
                  className="h-11 w-11 shrink-0 rounded-xl object-cover bg-[#F6F6F7]"
                />
                <div className="min-w-0">
                  <div className="truncate text-xs font-bold">{pinnedProduct.title}</div>
                  <div className="flex items-center gap-1.5 font-mono-data text-xs font-bold text-[#008060]">
                    <span>{discountedPrice} USDC</span>
                    {stream.flashDiscountPercent > 0 && (
                      <span className="text-[10px] text-[#6D7175]">
                        (خصم {stream.flashDiscountPercent}%)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  onInstantBuy(pinnedProduct, pinnedProduct.finish, stream.flashDiscountPercent)
                }
                className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-[#008060] px-3 py-2 text-[11px] font-bold text-white hover:bg-[#006E52]"
              >
                <ShoppingBag className="h-3.5 w-3.5" />
                <span>شراء</span>
              </button>
            </div>
          )}

          {/* Quick Live Comment Input */}
          <form onSubmit={handleSendComment} className="flex items-center gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="اكتب تعليقاً في البث..."
              className="flex-1 rounded-full border border-white/20 bg-black/55 px-3.5 py-2 text-xs text-white placeholder-white/60 outline-none focus:border-[#008060]"
            />
            <button
              type="submit"
              aria-label="إرسال تعليق"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#008060] text-white hover:bg-[#006E52]"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* Merchant Broadcast Studio Panel (Cleanly beside the 9:16 TikTok frame, never overlapping) */}
      {studioOpen && (
        <div className="w-full max-w-sm rounded-2xl border border-[#E1E3E5] bg-white p-5 text-[#202223] shadow-sm">
          <div className="flex items-center justify-between border-b border-[#E1E3E5] pb-3">
            <h3 className="font-display text-base font-bold">إعدادات بث القناة</h3>
            <button
              type="button"
              onClick={handleToggleLive}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold text-white ${
                stream.isLive ? 'bg-[#D72C0D] hover:bg-[#B8250B]' : 'bg-[#008060] hover:bg-[#006E52]'
              }`}
            >
              {stream.isLive ? 'إنهاء البث' : 'بدء البث الآن'}
            </button>
          </div>

          <div className="mt-4 space-y-3.5">
            <div>
              <label className="mb-1 block text-xs font-medium text-[#6D7175]">عنوان البث</label>
              <input
                type="text"
                value={stream.title}
                onChange={(e) => onUpdateStream({ ...stream, title: e.target.value })}
                className="w-full rounded-lg border border-[#C9CCCF] bg-white px-3 py-2 text-xs text-[#202223] outline-none focus:border-[#008060]"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-[#6D7175]">
                المنتج المثبت (سلة تيك توك)
              </label>
              <select
                value={pinnedProduct?.id || ''}
                onChange={(e) => onUpdateStream({ ...stream, pinnedProductId: e.target.value })}
                className="w-full rounded-lg border border-[#C9CCCF] bg-white px-3 py-2 text-xs text-[#202223] outline-none focus:border-[#008060]"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-[#6D7175]">خصم البث</label>
                <select
                  value={stream.flashDiscountPercent}
                  onChange={(e) =>
                    onUpdateStream({ ...stream, flashDiscountPercent: Number(e.target.value) })
                  }
                  className="w-full rounded-lg border border-[#C9CCCF] bg-white px-2.5 py-2 font-mono-data text-xs text-[#202223]"
                >
                  <option value={0}>0%</option>
                  <option value={10}>10%</option>
                  <option value={15}>15%</option>
                  <option value={20}>20%</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-[#6D7175]">التحدث باسم</label>
                <select
                  value={senderRole}
                  onChange={(e) => setSenderRole(e.target.value as 'viewer' | 'merchant')}
                  className="w-full rounded-lg border border-[#C9CCCF] bg-white px-2.5 py-2 text-xs text-[#202223]"
                >
                  <option value="viewer">متابع</option>
                  <option value="merchant">المذيع</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleWebcam}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#C9CCCF] bg-[#F6F6F7] px-3 py-2 text-xs font-semibold text-[#202223] hover:bg-[#EBEDEF]"
            >
              {stream.useWebcam ? (
                <>
                  <CameraOff className="h-4 w-4 text-[#D72C0D]" />
                  <span>إيقاف الكاميرا الحقيقية</span>
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4 text-[#008060]" />
                  <span>تشغيل الكاميرا للبث</span>
                </>
              )}
            </button>

            {cameraMsg && <p className="text-[11px] text-[#B98900]">{cameraMsg}</p>}
          </div>
        </div>
      )}
    </div>
  );
};
