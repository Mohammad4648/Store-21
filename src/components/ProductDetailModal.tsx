import React, { Suspense, lazy, useState } from 'react';
import {
  Box,
  CheckCircle2,
  Image as ImageIcon,
  MessageCircle,
  Minus,
  Plus,
  ShoppingBag,
  Star,
  Video,
  X,
} from 'lucide-react';
import { FINISH_LABELS } from '../data/initialData';
import { UI_COPY } from '../i18n/translations';
import { Language, Product, ProductFinish, StoreChannel } from '../types/commerce';

const LazyProduct3DCanvas = lazy(() => import('./Scene3DShowcase'));

interface ProductDetailModalProps {
  lang: Language;
  product: Product;
  channel?: StoreChannel;
  initialMode?: 'images' | 'video' | '3d';
  onClose: () => void;
  onAddToCart: (product: Product, finish: ProductFinish, quantity: number) => void;
  onOrderNow: (product: Product, finish: ProductFinish, quantity: number) => void;
  onContactSeller: (channelId: string) => void;
  onOpenChannel: (channelId: string) => void;
  onSubmitReview?: (productId: string, rating: number, comment: string) => Promise<void>;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  lang,
  product,
  channel,
  initialMode = 'images',
  onClose,
  onAddToCart,
  onOrderNow,
  onContactSeller,
  onOpenChannel,
  onSubmitReview,
}) => {
  const t = UI_COPY[lang];
  const hasValid3D = product.has3D || Boolean(product.model3dUrl);
  const [viewMode, setViewMode] = useState<'images' | 'video' | '3d'>(
    initialMode === '3d' && hasValid3D
      ? '3d'
      : initialMode === 'video' && product.videoUrl
      ? 'video'
      : 'images'
  );
  const gallery = product.gallery.length > 0 ? product.gallery : [product.image];
  const [activeImage, setActiveImage] = useState(gallery[0]);
  const [selectedFinish, setSelectedFinish] = useState<ProductFinish>(product.finish);
  const [quantity, setQuantity] = useState(1);

  // Customer reviews state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const title = lang === 'ar' ? product.title : product.titleEn;
  const description = lang === 'ar' ? product.description : product.descriptionEn;
  const category = lang === 'ar' ? product.category : product.categoryEn;
  const specs = lang === 'ar' ? product.specs : product.specsEn;
  const channelName = channel ? (lang === 'ar' ? channel.name : channel.nameEn) : '';

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim() || !onSubmitReview) return;
    setSubmittingReview(true);
    await onSubmitReview(product.id, reviewRating, reviewText.trim());
    setReviewText('');
    setSubmittingReview(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-[#E5E7EB] bg-white shadow-2xl">
        {/* Top Modal Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-[#E5E7EB] bg-white px-5 py-3.5 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 text-xs text-[#6B7280]">
            <span className="shrink-0">{category}</span>
            <span aria-hidden="true">·</span>
            <span className="truncate font-semibold text-[#141518]">{title}</span>
            <span aria-hidden="true" className="hidden sm:inline">·</span>
            <span className="hidden font-mono-data sm:inline">{product.sku}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.common.close}
            className="rounded-lg p-1.5 text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#141518]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-8 p-5 sm:p-6 lg:grid-cols-12">
          {/* Media & Lazy-Loaded 3D Column */}
          <div className="space-y-4 lg:col-span-7">
            <div className="inline-flex items-center gap-1 rounded-lg border border-[#E5E7EB] bg-[#F8F9FA] p-1">
              <button
                type="button"
                onClick={() => setViewMode('images')}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  viewMode === 'images' ? 'bg-white text-[#141518] shadow-xs' : 'text-[#6B7280]'
                }`}
              >
                <ImageIcon className="h-3.5 w-3.5" />
                <span>{lang === 'ar' ? 'الصور' : 'Images'}</span>
              </button>

              {product.videoUrl && (
                <button
                  type="button"
                  onClick={() => setViewMode('video')}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                    viewMode === 'video' ? 'bg-white text-[#141518] shadow-xs' : 'text-[#6B7280]'
                  }`}
                >
                  <Video className="h-3.5 w-3.5" />
                  <span>{lang === 'ar' ? 'فيديو' : 'Video'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setViewMode('3d')}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  viewMode === '3d'
                    ? 'bg-[#059669] text-white'
                    : 'text-[#6B7280] hover:text-[#141518]'
                }`}
              >
                <Box className="h-3.5 w-3.5" />
                <span>{t.common.inspect3D}</span>
              </button>
            </div>

            {viewMode === 'images' && (
              <>
                <div className="aspect-[4/3] w-full overflow-hidden rounded-xl border border-[#E5E7EB] bg-[#F4F3EF]">
                  <img
                    src={activeImage}
                    alt={title}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                </div>
                {gallery.length > 1 && (
                  <div className="flex items-center gap-2.5">
                    {gallery.map((img, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setActiveImage(img)}
                        className={`h-16 w-20 overflow-hidden rounded-lg border ${
                          activeImage === img
                            ? 'border-[#059669] ring-2 ring-[#059669]/25'
                            : 'border-[#E5E7EB]'
                        }`}
                      >
                        <img
                          src={img}
                          alt={`${title} ${i + 1}`}
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {viewMode === 'video' && product.videoUrl && (
              <div className="aspect-[4/3] w-full overflow-hidden rounded-xl border border-[#E5E7EB] bg-[#141518]">
                <video
                  src={product.videoUrl}
                  controls
                  playsInline
                  poster={product.image}
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            {viewMode === '3d' &&
              (hasValid3D ? (
                <Suspense
                  fallback={
                    <div className="flex h-[380px] items-center justify-center rounded-xl border border-[#E5E7EB] bg-[#0D1119] text-xs font-semibold text-white">
                      {lang === 'ar'
                        ? 'جاري تحميل العارض ثلاثي الأبعاد...'
                        : 'Loading interactive 3D viewer...'}
                    </div>
                  }
                >
                  <LazyProduct3DCanvas
                    lang={lang}
                    product={product}
                    selectedFinish={selectedFinish}
                    onSelectFinish={setSelectedFinish}
                    heightClass="h-[340px] sm:h-[400px]"
                  />
                </Suspense>
              ) : (
                <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-[#F8F9FA]">
                  <div className="aspect-[4/3] w-full">
                    <img
                      src={product.image}
                      alt={title}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="border-t border-[#E5E7EB] bg-white px-4 py-3 text-xs text-[#6B7280]">
                    {lang === 'ar'
                      ? 'النموذج ثلاثي الأبعاد غير متاح لهذا المنتج — يتم عرض الصورة عالية الدقة.'
                      : 'No 3D model attached for this item — showing studio fallback image.'}
                  </div>
                </div>
              ))}
          </div>

          {/* Contiguous Purchase & Specs Column */}
          <div className="flex flex-col justify-between space-y-5 lg:col-span-5">
            <div>
              <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                <span className={product.stock > 0 ? 'font-semibold text-[#059669]' : 'text-[#DC2626]'}>
                  {product.stock > 0
                    ? `${t.common.inStock} (${product.stock})`
                    : t.common.outOfStock}
                </span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1 tabular-nums">
                  <Star className="h-3.5 w-3.5 fill-[#059669] text-[#059669]" />
                  <span>{product.rating.toFixed(1)}</span>
                  <span className="text-[#9CA3AF]">
                    ({Math.max(product.reviewCount, product.reviews.length)})
                  </span>
                </span>
              </div>

              <h2 className="mt-2 font-display text-xl font-extrabold text-[#141518] sm:text-2xl">
                {title}
              </h2>

              <div className="mt-3 flex items-baseline gap-3">
                <span className="font-mono-data text-2xl font-bold text-[#059669]">
                  ${product.priceUSD.toLocaleString()}
                </span>
                {product.compareAtPriceUSD && product.compareAtPriceUSD > product.priceUSD && (
                  <span className="font-mono-data text-sm text-[#9CA3AF] line-through">
                    ${product.compareAtPriceUSD.toLocaleString()}
                  </span>
                )}
              </div>

              <p className="mt-3 text-sm leading-relaxed text-[#4B5563]">{description}</p>

              {/* Finish Picker */}
              <div className="mt-5 border-t border-[#F3F4F6] pt-4">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#141518]">
                    {lang === 'ar' ? 'الخامة / اللون' : 'Finish'}
                  </span>
                  <span className="text-[#6B7280]">
                    {lang === 'ar'
                      ? FINISH_LABELS[selectedFinish].label
                      : FINISH_LABELS[selectedFinish].labelEn}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {(Object.keys(FINISH_LABELS) as ProductFinish[]).map((fk) => (
                    <button
                      key={fk}
                      type="button"
                      onClick={() => setSelectedFinish(fk)}
                      aria-label={FINISH_LABELS[fk].labelEn}
                      className={`h-6 w-6 rounded-full border-2 transition-transform ${
                        selectedFinish === fk
                          ? 'scale-110 border-[#141518] ring-2 ring-[#059669]/30'
                          : 'border-[#D1D5DB]'
                      }`}
                      style={{ backgroundColor: FINISH_LABELS[fk].hex }}
                    />
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div className="mt-4 flex items-center justify-between border-t border-[#F3F4F6] pt-4">
                <span className="text-xs font-semibold text-[#141518]">
                  {lang === 'ar' ? 'الكمية' : 'Quantity'}
                </span>
                <div className="inline-flex items-center rounded-lg border border-[#D1D5DB]">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                    className="p-2 text-[#4B5563] hover:text-[#141518]"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-8 text-center font-mono-data text-xs font-semibold">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(Math.max(1, product.stock), q + 1))}
                    aria-label="Increase quantity"
                    className="p-2 text-[#4B5563] hover:text-[#141518]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Specifications */}
              {specs.length > 0 && (
                <div className="mt-4 border-t border-[#F3F4F6] pt-4">
                  <div className="mb-2 text-xs font-semibold text-[#141518]">
                    {lang === 'ar' ? 'المواصفات' : 'Specifications'}
                  </div>
                  <ul className="divide-y divide-[#F3F4F6] text-xs text-[#4B5563]">
                    {specs.map((sp, i) => (
                      <li key={i} className="flex items-center justify-between gap-2 py-1.5">
                        <span>{sp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="space-y-3 border-t border-[#E5E7EB] pt-4">
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={product.stock === 0}
                  onClick={() => {
                    onOrderNow(product, selectedFinish, quantity);
                    onClose();
                  }}
                  className="rounded-lg bg-[#059669] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#047857] disabled:opacity-40 whitespace-nowrap"
                >
                  {t.common.orderNow}
                </button>
                <button
                  type="button"
                  disabled={product.stock === 0}
                  onClick={() => onAddToCart(product, selectedFinish, quantity)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#D1D5DB] bg-white px-4 py-2.5 text-xs font-semibold text-[#141518] hover:border-[#141518] disabled:opacity-40 whitespace-nowrap"
                >
                  <ShoppingBag className="h-3.5 w-3.5" />
                  <span>{t.common.addToCart}</span>
                </button>
              </div>

              {channel && (
                <div className="flex items-center justify-between gap-2 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] p-3">
                  <button
                    type="button"
                    onClick={() => {
                      onOpenChannel(channel.id);
                      onClose();
                    }}
                    className="flex min-w-0 items-center gap-2 text-start"
                  >
                    <img
                      src={channel.avatarImage}
                      alt={channelName}
                      referrerPolicy="no-referrer"
                      className="h-8 w-8 shrink-0 rounded-full object-cover"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 truncate text-xs font-bold text-[#141518]">
                        <span className="truncate">{channelName}</span>
                        {channel.verified && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#059669]" />}
                      </div>
                      <div className="text-[11px] text-[#6B7280]">{channel.handle}</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onContactSeller(channel.id);
                      onClose();
                    }}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#D1D5DB] bg-white px-3 py-1.5 text-xs font-semibold text-[#141518] hover:border-[#059669] hover:text-[#059669] whitespace-nowrap"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>{t.common.contactSeller}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Customer Comments & Reviews Section */}
        <div className="border-t border-[#E5E7EB] bg-[#F8F9FA] px-5 py-5 sm:px-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display text-sm font-bold text-[#141518]">
              {lang === 'ar'
                ? `تقييمات وتعليقات العملاء (${product.reviews.length})`
                : `Customer Reviews & Comments (${product.reviews.length})`}
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="space-y-2.5 lg:col-span-7">
              {product.reviews.length === 0 ? (
                <p className="text-xs text-[#6B7280]">
                  {lang === 'ar'
                    ? 'لا توجد تعليقات على هذا المنتج بعد.'
                    : 'No customer reviews yet. Share the first impression.'}
                </p>
              ) : (
                product.reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="rounded-xl border border-[#E5E7EB] bg-white p-3.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#141518]">{rev.author}</span>
                      <div className="flex items-center gap-2 text-[#6B7280]">
                        <span className="inline-flex items-center gap-0.5 font-semibold text-[#059669] tabular-nums">
                          <Star className="h-3 w-3 fill-[#059669]" />
                          {rev.rating}
                        </span>
                        <span>·</span>
                        <span>{rev.date}</span>
                      </div>
                    </div>
                    <p className="mt-1.5 leading-relaxed text-[#4B5563]">
                      {lang === 'ar' ? rev.comment : rev.commentEn}
                    </p>
                  </div>
                ))
              )}
            </div>

            {onSubmitReview && (
              <form
                onSubmit={handleReviewSubmit}
                className="space-y-3 rounded-xl border border-[#E5E7EB] bg-white p-4 lg:col-span-5"
              >
                <div className="text-xs font-bold text-[#141518]">
                  {lang === 'ar' ? 'أضف تقييمك وتعليقك' : 'Write a Review'}
                </div>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      aria-label={`Rate ${star}`}
                      className="p-0.5"
                    >
                      <Star
                        className={`h-4 w-4 ${
                          star <= reviewRating
                            ? 'fill-[#059669] text-[#059669]'
                            : 'text-[#D1D5DB]'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <textarea
                  rows={2}
                  required
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder={lang === 'ar' ? 'شارك تجربتك مع المنتج...' : 'Share your product experience...'}
                  className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-xs text-[#141518] outline-none focus:border-[#059669]"
                />
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full rounded-lg bg-[#141518] py-2 text-xs font-semibold text-white hover:bg-[#059669] disabled:opacity-50"
                >
                  {submittingReview
                    ? lang === 'ar'
                      ? 'جاري النشر...'
                      : 'Posting...'
                    : lang === 'ar'
                    ? 'نشر التعليق'
                    : 'Submit Review'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
