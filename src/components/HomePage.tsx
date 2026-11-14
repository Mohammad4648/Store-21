import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Box,
  CheckCircle2,
  Eye,
  Heart,
  MessageSquare,
  Radio,
  Users,
} from 'lucide-react';
import { STUDIO_LIVE_BACKDROP } from '../data/initialData';
import { UI_COPY } from '../i18n/translations';
import { ChannelPost, Language, Product, StoreChannel } from '../types/commerce';
import { localizeTimestamp } from '../utils/commerceLogic';
import { EcommerceProductCard } from './EcommerceProductCard';

interface HomePageProps {
  lang: Language;
  channels: StoreChannel[];
  posts: ChannelPost[];
  products: Product[];
  searchQuery: string;
  onOpenChannel: (channelId: string) => void;
  onToggleFollow: (channelId: string) => void;
  onOpenProduct: (product: Product, mode?: 'images' | 'video' | '3d') => void;
  onAddToCart: (product: Product) => void;
  onReactPost: (postId: string, key: 'heart' | 'thumbs' | 'fire') => void;
  onNavigateChannels: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  lang,
  channels,
  posts,
  products,
  searchQuery,
  onOpenChannel,
  onToggleFollow,
  onOpenProduct,
  onAddToCart,
  onReactPost,
  onNavigateChannels,
}) => {
  const t = UI_COPY[lang];
  const ArrowIcon = lang === 'ar' ? ArrowLeft : ArrowRight;
  const q = searchQuery.trim().toLowerCase();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [only3D, setOnly3D] = useState(false);

  const categories = useMemo(() => {
    const map = new Map<string, { key: string; ar: string; en: string }>();
    products.forEach((p) => {
      if (!map.has(p.categoryEn)) {
        map.set(p.categoryEn, { key: p.categoryEn, ar: p.category, en: p.categoryEn });
      }
    });
    return Array.from(map.values());
  }, [products]);

  // 1. Recommended Channels (Discover & Follow)
  const recommendedChannels = useMemo(() => {
    const base = q
      ? channels.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.nameEn.toLowerCase().includes(q) ||
            c.category.toLowerCase().includes(q) ||
            c.categoryEn.toLowerCase().includes(q)
        )
      : channels;
    return base.slice(0, 4);
  }, [channels, q]);

  // 2. Recent Posts & Live Updates (Channel-centric feed updates)
  const recentPostsAndUpdates = useMemo(() => {
    return posts
      .filter((p) => p.type === 'announcement' || (p.type === 'live' && p.liveActive !== false))
      .filter((p) => {
        if (!q) return true;
        const ch = channels.find((c) => c.id === p.channelId);
        return (
          p.text.toLowerCase().includes(q) ||
          p.textEn.toLowerCase().includes(q) ||
          (p.liveTitle || '').toLowerCase().includes(q) ||
          (p.liveTitleEn || '').toLowerCase().includes(q) ||
          Boolean(ch && (ch.name.toLowerCase().includes(q) || ch.nameEn.toLowerCase().includes(q)))
        );
      })
      .slice(0, 4);
  }, [posts, channels, q]);

  // 3. Popular Channel Products
  const popularProducts = useMemo(() => {
    return products
      .filter((p) => (selectedCategory === 'all' ? true : p.categoryEn === selectedCategory))
      .filter((p) => (only3D ? p.has3D || Boolean(p.model3dUrl) : true))
      .filter((p) => {
        if (!q) return true;
        return (
          p.title.toLowerCase().includes(q) ||
          p.titleEn.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.categoryEn.toLowerCase().includes(q)
        );
      })
      .slice(0, 6);
  }, [products, selectedCategory, only3D, q]);

  return (
    <div className="space-y-10">
      {/* Section 1: Recommended Channels */}
      <section aria-labelledby="recommended-channels-heading" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1
              id="recommended-channels-heading"
              className="font-display text-xl font-extrabold text-[#141518] sm:text-2xl"
            >
              {lang === 'ar' ? 'القنوات المقترحة' : 'Recommended Channels'}
            </h1>
            <p className="mt-1 text-xs text-[#6B7280]">
              {lang === 'ar'
                ? 'تابع قنوات المتاجر الموثوقة للوصول إلى المنشورات والمنتجات والبث المباشر ومجموعات النقاش.'
                : 'Follow merchant channels for updates, products, live broadcasts, and discussions in one place.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onNavigateChannels}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#059669] hover:underline whitespace-nowrap"
          >
            <span>{t.common.viewAll}</span>
            <ArrowIcon className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {recommendedChannels.map((ch) => {
            const hasLive = posts.some(
              (p) => p.channelId === ch.id && p.type === 'live' && p.liveActive !== false
            );
            return (
              <article
                key={ch.id}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-[#D1D5DB] hover:shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => onOpenChannel(ch.id)}
                  className="block w-full text-start"
                >
                  <div className="relative h-24 w-full overflow-hidden border-b border-[#F3F4F6] bg-[#F3F4F6]">
                    <img
                      src={ch.bannerImage}
                      alt={lang === 'ar' ? ch.name : ch.nameEn}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                    {hasLive && (
                      <span className="absolute start-2.5 top-2.5 inline-flex items-center gap-1 rounded-md bg-[#DC2626] px-2 py-0.5 text-[10px] font-bold text-white">
                        <Radio className="h-2.5 w-2.5" />
                        <span>{t.common.live}</span>
                      </span>
                    )}
                  </div>

                  <div className="px-4 pt-3.5">
                    <div className="flex items-center gap-3">
                      <img
                        src={ch.avatarImage}
                        alt={lang === 'ar' ? ch.name : ch.nameEn}
                        referrerPolicy="no-referrer"
                        className="h-11 w-11 shrink-0 rounded-full border border-[#E5E7EB] bg-white object-cover"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <h2 className="truncate font-display text-sm font-bold text-[#141518] group-hover:text-[#059669]">
                            {lang === 'ar' ? ch.name : ch.nameEn}
                          </h2>
                          {ch.verified && (
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#059669]" />
                          )}
                        </div>
                        <div className="mt-0.5 truncate text-[11px] text-[#6B7280] tabular-nums">
                          {lang === 'ar' ? ch.category : ch.categoryEn} ·{' '}
                          {ch.followersCount.toLocaleString()}{' '}
                          {lang === 'ar' ? 'مشترك' : 'subscribers'}
                        </div>
                      </div>
                    </div>

                    <p className="mt-2.5 min-h-[2.5rem] line-clamp-2 text-xs leading-relaxed text-[#4B5563]">
                      {lang === 'ar' ? ch.description : ch.descriptionEn}
                    </p>
                  </div>
                </button>

                <div className="mt-4 flex items-center gap-2 border-t border-[#F3F4F6] bg-[#FCFCFD] px-4 py-3">
                  <button
                    type="button"
                    onClick={() => onToggleFollow(ch.id)}
                    className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                      ch.isFollowed
                        ? 'border border-[#059669] bg-[#ECFDF5] text-[#059669]'
                        : 'bg-[#059669] text-white hover:bg-[#047857]'
                    }`}
                  >
                    {ch.isFollowed ? t.common.following : t.common.follow}
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenChannel(ch.id)}
                    className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs font-semibold text-[#141518] hover:border-[#141518] whitespace-nowrap"
                  >
                    {lang === 'ar' ? 'دخول' : 'Open'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Section 2: Recent Posts & Live Updates */}
      {recentPostsAndUpdates.length > 0 && (
        <section
          aria-labelledby="recent-updates-heading"
          className="space-y-4 border-t border-[#E5E7EB] pt-8"
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2
                id="recent-updates-heading"
                className="font-display text-xl font-extrabold text-[#141518] sm:text-2xl"
              >
                {lang === 'ar' ? 'أحدث المنشورات والتحديثات' : 'Recent Posts & Updates'}
              </h2>
              <p className="mt-1 text-xs text-[#6B7280]">
                {lang === 'ar'
                  ? 'إعلانات القنوات وجلسات البث المباشر الجارية حالياً.'
                  : 'Latest announcements and active live sessions across channels.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {recentPostsAndUpdates.map((post) => {
              const ch = channels.find((c) => c.id === post.channelId);
              const isLive = post.type === 'live';
              const mediaImage = isLive ? STUDIO_LIVE_BACKDROP : post.image;
              return (
                <article
                  key={post.id}
                  className="flex flex-col justify-between rounded-2xl border border-[#E5E7EB] bg-white p-5"
                >
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      {ch && (
                        <button
                          type="button"
                          onClick={() => onOpenChannel(ch.id)}
                          className="flex min-w-0 items-center gap-2.5 text-start"
                        >
                          <img
                            src={ch.avatarImage}
                            alt={lang === 'ar' ? ch.name : ch.nameEn}
                            referrerPolicy="no-referrer"
                            className="h-9 w-9 shrink-0 rounded-full border border-[#E5E7EB] object-cover"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1 text-xs font-bold text-[#141518] hover:text-[#059669]">
                              <span className="truncate">{lang === 'ar' ? ch.name : ch.nameEn}</span>
                              {ch.verified && (
                                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#059669]" />
                              )}
                            </div>
                            <div className="text-[11px] text-[#6B7280]">{localizeTimestamp(post.timestamp, lang)}</div>
                          </div>
                        </button>
                      )}

                      {isLive && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-[#DC2626] px-2 py-1 text-[11px] font-bold text-white tabular-nums">
                          <Radio className="h-3 w-3" />
                          <span>{t.common.live}</span>
                          <span aria-hidden="true">·</span>
                          <Users className="h-3 w-3" />
                          <span>{(post.liveViewerCount || 0).toLocaleString()}</span>
                        </span>
                      )}
                    </div>

                    {isLive && (post.liveTitle || post.liveTitleEn) && (
                      <h3 className="mt-3 font-display text-sm font-bold text-[#141518]">
                        {lang === 'ar' ? post.liveTitle : post.liveTitleEn}
                      </h3>
                    )}

                    <p className="mt-2 text-sm leading-relaxed text-[#374151]">
                      {lang === 'ar' ? post.text : post.textEn}
                    </p>

                    {mediaImage && (
                      <div className="mt-3 aspect-[16/9] overflow-hidden rounded-xl bg-[#F4F3EF]">
                        <img
                          src={mediaImage}
                          alt={ch ? (lang === 'ar' ? ch.name : ch.nameEn) : 'Channel update'}
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-[#F3F4F6] pt-3 text-xs text-[#6B7280]">
                    <div className="flex items-center gap-4 tabular-nums">
                      <button
                        type="button"
                        onClick={() => onReactPost(post.id, 'heart')}
                        className="inline-flex items-center gap-1 transition-colors hover:text-[#DC2626]"
                      >
                        <Heart className="h-3.5 w-3.5 text-[#EF4444]" />
                        <span>{post.reactions.heart.toLocaleString()}</span>
                      </button>
                      <span className="inline-flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        <span>{post.viewsCount.toLocaleString()}</span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>{post.comments.length}</span>
                      </span>
                    </div>

                    {ch && (
                      <button
                        type="button"
                        onClick={() => onOpenChannel(ch.id)}
                        className="font-semibold text-[#059669] hover:underline whitespace-nowrap"
                      >
                        {isLive
                          ? lang === 'ar'
                            ? 'انضم للبث في القناة'
                            : 'Watch in Channel'
                          : lang === 'ar'
                          ? 'فتح القناة'
                          : 'Open Channel'}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* Section 3: Popular Channel Products */}
      <section
        aria-labelledby="popular-products-heading"
        className="space-y-5 border-t border-[#E5E7EB] pt-8"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2
              id="popular-products-heading"
              className="font-display text-xl font-extrabold text-[#141518] sm:text-2xl"
            >
              {lang === 'ar' ? 'المنتجات الشائعة في القنوات' : 'Popular Channel Products'}
            </h2>
            <p className="mt-1 text-xs text-[#6B7280]">
              {lang === 'ar'
                ? 'اطلب المنتجات مباشرة أو استعرضها بتقنية ثلاثية الأبعاد دون مغادرة المنصة.'
                : 'Inspect media or 3D models and order directly from merchant channels.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div
              role="group"
              aria-label={lang === 'ar' ? 'تصفية حسب الفئة' : 'Filter by category'}
              className="flex flex-wrap items-center gap-1 rounded-xl border border-[#E5E7EB] bg-white p-1"
            >
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  selectedCategory === 'all'
                    ? 'bg-[#141518] text-white'
                    : 'text-[#6B7280] hover:text-[#141518]'
                }`}
              >
                {lang === 'ar' ? 'الكل' : 'All'}
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                    selectedCategory === cat.key
                      ? 'bg-[#141518] text-white'
                      : 'text-[#6B7280] hover:text-[#141518]'
                  }`}
                >
                  {lang === 'ar' ? cat.ar : cat.en}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setOnly3D((prev) => !prev)}
              aria-pressed={only3D}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                only3D
                  ? 'border-[#059669] bg-[#ECFDF5] text-[#059669]'
                  : 'border-[#E5E7EB] bg-white text-[#4B5563] hover:text-[#141518]'
              }`}
            >
              <Box className="h-3.5 w-3.5" />
              <span>{lang === 'ar' ? 'عرض 3D' : '3D Ready'}</span>
            </button>
          </div>
        </div>

        {popularProducts.length === 0 ? (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-10 text-center text-xs text-[#6B7280]">
            {lang === 'ar' ? 'لا توجد منتجات مطابقة لبحثك.' : 'No products match your search query.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {popularProducts.map((product) => {
              const ch = channels.find((c) => c.id === product.channelId);
              return (
                <EcommerceProductCard
                  key={product.id}
                  lang={lang}
                  product={product}
                  channelName={ch ? (lang === 'ar' ? ch.name : ch.nameEn) : undefined}
                  onOpenProduct={onOpenProduct}
                  onAddToCart={onAddToCart}
                />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
