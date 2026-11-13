import React, { useState } from 'react';
import { Box, Plus, ShoppingBag } from 'lucide-react';
import { FINISH_LABELS, PRODUCT_IMAGES } from '../data/initialData';
import { Product, Product3DModelType, ProductFinish, StoreChannel } from '../types/commerce';

interface ShopifyCatalogViewProps {
  channels: StoreChannel[];
  activeChannel: StoreChannel;
  products: Product[];
  searchQuery: string;
  onInspectIn3D: (product: Product) => void;
  onAddToCart: (product: Product, finish: ProductFinish) => void;
  onInstantBuy: (product: Product, finish: ProductFinish) => void;
  onAddProduct: (product: Product) => void;
}

export const ShopifyCatalogView: React.FC<ShopifyCatalogViewProps> = ({
  channels,
  activeChannel,
  products,
  searchQuery,
  onInspectIn3D,
  onAddToCart,
  onInstantBuy,
  onAddProduct,
}) => {
  const [selectedChannelFilter, setSelectedChannelFilter] = useState<string>('all');
  const [addingProduct, setAddingProduct] = useState(false);

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('350');
  const [stock, setStock] = useState('20');
  const [model, setModel] = useState<Product3DModelType>('watch');
  const [finish, setFinish] = useState<ProductFinish>('gold');

  const filtered = products.filter((p) => {
    const matchesCh = selectedChannelFilter === 'all' || p.channelId === selectedChannelFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesQ =
      !q || p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    return matchesCh && matchesQ;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddProduct({
      id: `prod-${Date.now()}`,
      channelId: activeChannel.id,
      title: title.trim(),
      category: activeChannel.category,
      description: 'منتج مضاف عبر لوحة منتجات شوبيفاي مع معاينة 3D وتسوية بالبلوك تشين.',
      priceUSDC: Math.max(1, Number(price) || 100),
      stock: Math.max(1, Number(stock) || 10),
      image: PRODUCT_IMAGES[model],
      model3d: model,
      finish,
      sku: `SC-${Math.floor(1000 + Math.random() * 9000)}`,
      specs: ['معاينة 3D', 'دفع بالبلوك تشين'],
    });
    setTitle('');
    setAddingProduct(false);
  };

  return (
    <section className="mx-auto max-w-[1440px] p-4 sm:p-8">
      <div className="flex flex-col gap-4 border-b border-[#E1E3E5] pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#202223]">كتالوج المنتجات</h2>
          <p className="text-xs text-[#6D7175]">
            إدارة وعرض منتجات جميع المتاجر مع الدفع بالبلوك تشين والمعاينة ثلاثية الأبعاد
          </p>
        </div>

        <button
          type="button"
          onClick={() => setAddingProduct((prev) => !prev)}
          className="inline-flex items-center gap-2 self-start rounded-xl bg-[#008060] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#006E52] sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>إضافة منتج جديد</span>
        </button>
      </div>

      {addingProduct && (
        <form
          onSubmit={handleCreate}
          className="mt-5 rounded-2xl border border-[#E1E3E5] bg-white p-5 shadow-xs"
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="اسم المنتج"
              className="md:col-span-2 rounded-lg border border-[#C9CCCF] px-3 py-2 text-xs text-[#202223]"
            />
            <input
              type="number"
              min={1}
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="السعر USDC"
              className="rounded-lg border border-[#C9CCCF] px-3 py-2 font-mono-data text-xs text-[#202223]"
            />
            <select
              value={model}
              onChange={(e) => setModel(e.target.value as Product3DModelType)}
              className="rounded-lg border border-[#C9CCCF] px-3 py-2 text-xs text-[#202223]"
            >
              <option value="watch">ساعة 3D</option>
              <option value="perfume">عطر 3D</option>
              <option value="headphones">سماعة 3D</option>
              <option value="vault">خزنة بلوكتشين 3D</option>
            </select>
            <select
              value={finish}
              onChange={(e) => setFinish(e.target.value as ProductFinish)}
              className="rounded-lg border border-[#C9CCCF] px-3 py-2 text-xs text-[#202223]"
            >
              {(Object.keys(FINISH_LABELS) as ProductFinish[]).map((fk) => (
                <option key={fk} value={fk}>
                  {FINISH_LABELS[fk].label}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-[#6D7175]">
              <span>المخزون:</span>
              <input
                type="number"
                min={1}
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-20 rounded-lg border border-[#C9CCCF] px-2 py-1 font-mono-data text-xs text-[#202223]"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-[#008060] px-5 py-2 text-xs font-bold text-white hover:bg-[#006E52]"
            >
              حفظ المنتج
            </button>
          </div>
        </form>
      )}

      {/* Channel Filter Pills */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setSelectedChannelFilter('all')}
          className={`rounded-lg border px-3.5 py-1.5 text-xs font-semibold ${
            selectedChannelFilter === 'all'
              ? 'border-[#008060] bg-[#EBF5F2] text-[#008060]'
              : 'border-[#E1E3E5] bg-white text-[#6D7175]'
          }`}
        >
          الكل ({products.length})
        </button>
        {channels.map((ch) => (
          <button
            key={ch.id}
            type="button"
            onClick={() => setSelectedChannelFilter(ch.id)}
            className={`rounded-lg border px-3.5 py-1.5 text-xs font-semibold ${
              selectedChannelFilter === ch.id
                ? 'border-[#008060] bg-[#EBF5F2] text-[#008060]'
                : 'border-[#E1E3E5] bg-white text-[#6D7175]'
            }`}
          >
            {ch.name}
          </button>
        ))}
      </div>

      {/* Shopify Clean 3-Column Product Grid */}
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((prod) => (
          <article
            key={prod.id}
            className="flex flex-col overflow-hidden rounded-2xl border border-[#E1E3E5] bg-white shadow-xs transition-transform duration-150 hover:-translate-y-0.5"
          >
            <div className="relative aspect-[4/3] w-full bg-[#F6F6F7]">
              <img
                src={prod.image}
                alt={prod.title}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => onInspectIn3D(prod)}
                className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-lg bg-white/95 px-3 py-1.5 text-xs font-bold text-[#202223] shadow-sm hover:text-[#008060]"
              >
                <Box className="h-3.5 w-3.5" />
                <span>معاينة 3D</span>
              </button>
            </div>

            <div className="flex flex-1 flex-col justify-between p-5">
              <div>
                <div className="text-xs text-[#6D7175]">
                  {prod.category} · متوفر {prod.stock}
                </div>
                <h3 className="mt-1 font-display text-base font-bold text-[#202223]">
                  {prod.title}
                </h3>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-[#F1F2F4] pt-4">
                <span className="font-mono-data text-lg font-bold text-[#008060]">
                  {prod.priceUSDC.toLocaleString()} USDC
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onAddToCart(prod, prod.finish)}
                    aria-label="أضف للسلة"
                    className="rounded-lg border border-[#C9CCCF] bg-white p-2 text-[#202223] hover:bg-[#F6F6F7]"
                  >
                    <ShoppingBag className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onInstantBuy(prod, prod.finish)}
                    className="rounded-lg bg-[#008060] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#006E52]"
                  >
                    شراء
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
