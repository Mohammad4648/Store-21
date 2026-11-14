import React, { useState } from 'react';
import { Box, MessageSquare, ShoppingBag, Star } from 'lucide-react';
import { UI_COPY } from '../i18n/translations';
import { Language, Product } from '../types/commerce';

interface EcommerceProductCardProps {
  lang: Language;
  product: Product;
  channelName?: string;
  onOpenProduct: (product: Product, mode?: 'images' | 'video' | '3d') => void;
  onAddToCart: (product: Product) => void;
}

export const EcommerceProductCard: React.FC<EcommerceProductCardProps> = ({
  lang,
  product,
  channelName,
  onOpenProduct,
  onAddToCart,
}) => {
  const t = UI_COPY[lang];
  const [imgFailed, setImgFailed] = useState(false);

  const title = lang === 'ar' ? product.title : product.titleEn;
  const category = lang === 'ar' ? product.category : product.categoryEn;
  const has3D = product.has3D || Boolean(product.model3dUrl);
  const reviewTotal = Math.max(product.reviewCount, product.reviews.length);

  return (
    <article className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-[#D1D5DB] hover:shadow-md">
      <div>
        {/* Product Image (65–70% visual lead) */}
        <div className="relative aspect-[4/3] w-full overflow-hidden border-b border-[#F3F4F6] bg-[#F4F3EF]">
          <button
            type="button"
            onClick={() => onOpenProduct(product, 'images')}
            className="block h-full w-full text-start"
            aria-label={title}
          >
            {!imgFailed ? (
              <img
                src={product.image}
                alt={title}
                referrerPolicy="no-referrer"
                onError={() => setImgFailed(true)}
                className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[#F4F3EF] p-4 text-center text-xs text-[#6B7280]">
                <ShoppingBag className="h-7 w-7 text-[#9CA3AF]" />
                <span className="line-clamp-2 font-semibold">{title}</span>
              </div>
            )}
          </button>

          {has3D && (
            <button
              type="button"
              onClick={() => onOpenProduct(product, '3d')}
              aria-label={t.common.inspect3D}
              className="absolute end-3 top-3 inline-flex items-center gap-1 rounded-lg border border-[#E5E7EB] bg-white/95 px-2.5 py-1 text-[11px] font-bold text-[#141518] shadow-xs transition-colors hover:border-[#059669] hover:text-[#059669]"
            >
              <Box className="h-3.5 w-3.5 text-[#059669]" />
              <span>3D</span>
            </button>
          )}
        </div>

        {/* Clean Unboxed Metadata + Title + Price */}
        <div className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#6B7280]">
            <span>{category}</span>
            {channelName && (
              <>
                <span aria-hidden="true">·</span>
                <span className="truncate max-w-[140px]">{channelName}</span>
              </>
            )}
            <span aria-hidden="true">·</span>
            <span className={product.stock > 0 ? 'font-medium text-[#059669]' : 'font-medium text-[#DC2626]'}>
              {product.stock > 0 ? `${t.common.inStock} (${product.stock})` : t.common.outOfStock}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onOpenProduct(product, 'images')}
            className="mt-2 block min-h-[2.75rem] text-start font-display text-[15px] font-bold leading-snug text-[#141518] line-clamp-2 transition-colors hover:text-[#059669]"
          >
            {title}
          </button>

          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="flex items-baseline gap-2">
              <span className="font-mono-data text-lg font-extrabold text-[#141518]">
                ${product.priceUSD.toLocaleString()}
              </span>
              {product.compareAtPriceUSD && product.compareAtPriceUSD > product.priceUSD && (
                <span className="font-mono-data text-xs text-[#9CA3AF] line-through">
                  ${product.compareAtPriceUSD.toLocaleString()}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5 text-xs text-[#6B7280] tabular-nums">
              <span className="inline-flex items-center gap-1 font-semibold text-[#141518]">
                <Star className="h-3.5 w-3.5 fill-[#059669] text-[#059669]" />
                <span>{product.rating.toFixed(1)}</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5" />
                <span>{reviewTotal}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Consistent Card Actions */}
      <div className="flex items-center gap-2 border-t border-[#F3F4F6] bg-[#FCFCFD] px-4 py-3 sm:px-5">
        <button
          type="button"
          onClick={() => onOpenProduct(product, 'images')}
          className="flex-1 rounded-lg border border-[#D1D5DB] bg-white px-3 py-2 text-xs font-semibold text-[#141518] transition-colors hover:border-[#141518] whitespace-nowrap"
        >
          {t.common.viewDetails}
        </button>
        <button
          type="button"
          disabled={product.stock === 0}
          onClick={() => onAddToCart(product)}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#059669] px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#047857] disabled:opacity-40 whitespace-nowrap"
        >
          <ShoppingBag className="h-3.5 w-3.5" />
          <span>{t.common.addToCart}</span>
        </button>
      </div>
    </article>
  );
};
