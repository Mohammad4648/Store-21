import React, { useState } from 'react';
import { Blocks, CheckCircle2, Link2, RefreshCw, Unplug } from 'lucide-react';
import { PRODUCT_IMAGES } from '../data/initialData';
import { PlatformId, PlatformIntegration, Product, StoreChannel } from '../types/commerce';
import { PlatformLogo } from './BrandIcons';

interface PlatformIntegrationsSectionProps {
  integrations: PlatformIntegration[];
  activeChannel: StoreChannel;
  onUpdateIntegration: (updated: PlatformIntegration) => void;
  onImportSyncedProduct: (product: Product) => void;
}

const SAMPLE_SYNC_PRODUCTS: Record<PlatformId, { title: string; price: number; model: Product['model3d']; finish: Product['finish'] }> = {
  salla: {
    title: 'ساعة الأفق الذهبية — مستوردة من سلة',
    price: 980,
    model: 'watch',
    finish: 'gold',
  },
  zid: {
    title: 'خلاصة دهن العود المعتق — مستورد من زد',
    price: 410,
    model: 'perfume',
    finish: 'copper',
  },
  shopify: {
    title: 'سماعة استوديو احترافية Pro — مستوردة من Shopify',
    price: 620,
    model: 'headphones',
    finish: 'titanium',
  },
  woocommerce: {
    title: 'وحدة حفظ بارد WooVault — مستوردة من WooCommerce',
    price: 340,
    model: 'vault',
    finish: 'platinum',
  },
  amazon: {
    title: 'ساعة كرونوغراف ألياف الكربون — Amazon SP',
    price: 1120,
    model: 'watch',
    finish: 'titanium',
  },
  magento: {
    title: 'نظام صوتي معياري Magento Studio',
    price: 780,
    model: 'headphones',
    finish: 'gold',
  },
};

export const PlatformIntegrationsSection: React.FC<PlatformIntegrationsSectionProps> = ({
  integrations,
  activeChannel,
  onUpdateIntegration,
  onImportSyncedProduct,
}) => {
  const [configuringId, setConfiguringId] = useState<PlatformId | null>(null);
  const [storeUrlInput, setStoreUrlInput] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [syncNotice, setSyncNotice] = useState('');

  const openConfig = (item: PlatformIntegration) => {
    setConfiguringId(item.id);
    setStoreUrlInput(item.storeUrl || `https://store.${item.id}.example.com`);
    setApiKeyInput(item.apiKeyMasked || 'sk_live_9481a2c0f8b1');
    setSyncNotice('');
  };

  const handleSaveConnection = (e: React.FormEvent, item: PlatformIntegration) => {
    e.preventDefault();
    const masked =
      apiKeyInput.length > 6
        ? `${apiKeyInput.slice(0, 6)}••••${apiKeyInput.slice(-4)}`
        : 'api_••••••••1234';

    onUpdateIntegration({
      ...item,
      status: 'connected',
      storeUrl: storeUrlInput.trim(),
      apiKeyMasked: masked,
      webhookActive: true,
      lastSync: 'الآن',
      syncedProductsCount: Math.max(item.syncedProductsCount, 8),
    });
    setConfiguringId(null);
    setSyncNotice(`تم ربط ${item.name} بقناة "${activeChannel.name}" وتفعيل Webhook للمخزون والطلبات.`);
  };

  const handleDisconnect = (item: PlatformIntegration) => {
    onUpdateIntegration({
      ...item,
      status: 'disconnected',
      webhookActive: false,
      lastSync: 'غير مربوط',
    });
    setConfiguringId(null);
  };

  const handleSyncNow = (item: PlatformIntegration) => {
    const sample = SAMPLE_SYNC_PRODUCTS[item.id];
    const importedProduct: Product = {
      id: `sync-${item.id}-${Date.now()}`,
      channelId: activeChannel.id,
      title: sample.title,
      category: `مزامنة ${item.name}`,
      description: `منتج تمت مزامنته آلياً عبر API من متجر ${item.name} مع تفعيل التسوية الفورية بالبلوك تشين.`,
      priceUSDC: sample.price,
      stock: 22,
      image: PRODUCT_IMAGES[sample.model],
      model3d: sample.model,
      finish: sample.finish,
      sku: `${item.id.toUpperCase().slice(0, 3)}-${Math.floor(100 + Math.random() * 899)}`,
      syncedFrom: item.name,
      specs: [`مستورد من ${item.name}`, 'تحديث مخزون لحظي', 'دفع بالبلوك تشين'],
    };

    onImportSyncedProduct(importedProduct);
    onUpdateIntegration({
      ...item,
      lastSync: 'الآن',
      syncedProductsCount: item.syncedProductsCount + 1,
    });
    setSyncNotice(`تم استيراد "${sample.title}" بنجاح إلى قناة ${activeChannel.name}.`);
  };

  return (
    <section id="integrations" className="py-6 sm:py-8">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8">
        <div className="flex flex-col gap-3 border-b border-[#E1E3E5] pb-5 md:flex-row md:items-end md:justify-between">
          <div className="flex items-start gap-4">
            <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#E1E3E5] bg-white shadow-xs sm:flex">
              <Blocks className="h-6 w-6 text-[#008060]" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#008060]">تكامل المتاجر الإلكترونية</div>
              <h2 className="mt-1 font-display text-2xl font-bold text-[#202223]">
                الربط المباشر مع أشهر منصات التجارة العالمية والمحلية
              </h2>
              <p className="mt-1 max-w-2xl text-xs sm:text-sm text-[#6D7175]">
                استورد منتجات متجرك الحالي من سلة أو زد أو Shopify أو WooCommerce، وحافظ على مزامنة
                المخزون والطلبات مع قبول مدفوعات البلوك تشين داخل قناتك.
              </p>
            </div>
          </div>
          <div className="text-xs text-[#6D7175]">
            القناة المستهدفة للاستيراد:{' '}
            <span className="font-bold text-[#202223]">{activeChannel.name}</span>
          </div>
        </div>

        {syncNotice && (
          <div className="mt-5 flex items-center justify-between gap-4 rounded-xl border border-[#C7E6DC] bg-[#EBF5F2] px-4 py-3 text-xs text-[#006E52]">
            <span className="font-medium">{syncNotice}</span>
            <button
              type="button"
              onClick={() => setSyncNotice('')}
              className="font-bold text-[#202223] hover:underline"
            >
              إخفاء
            </button>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {integrations.map((item) => {
            const isConnected = item.status === 'connected';
            const isEditing = configuringId === item.id;

            return (
              <div
                key={item.id}
                className="flex flex-col justify-between rounded-2xl border border-[#E1E3E5] bg-white p-6 shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <PlatformLogo id={item.id} className="h-9 w-9 shrink-0" />
                      <div>
                        <h3 className="font-display text-base font-bold text-[#202223]">
                          {item.name}
                        </h3>
                        <span className="text-xs text-[#6D7175]">{item.regionLabel}</span>
                      </div>
                    </div>
                    {isConnected ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#008060]">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>متصل ومفعل</span>
                      </span>
                    ) : (
                      <span className="text-xs text-[#8C9196]">غير متصل</span>
                    )}
                  </div>

                  <p className="mt-3 text-xs leading-relaxed text-[#6D7175]">{item.subtitle}</p>

                  {isConnected && !isEditing && (
                    <div className="mt-4 space-y-1.5 border-t border-[#F1F2F4] pt-3 text-xs text-[#202223]">
                      <div className="flex items-center justify-between">
                        <span className="text-[#6D7175]">رابط المتجر:</span>
                        <span
                          dir="ltr"
                          className="max-w-[180px] truncate font-mono-data text-[#202223]"
                        >
                          {item.storeUrl}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#6D7175]">المنتجات المتزامنة:</span>
                        <span className="font-mono-data font-bold text-[#008060]">
                          {item.syncedProductsCount}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#6D7175]">آخر مزامنة:</span>
                        <span>{item.lastSync}</span>
                      </div>
                    </div>
                  )}

                  {isEditing && (
                    <form
                      onSubmit={(e) => handleSaveConnection(e, item)}
                      className="mt-4 space-y-3 border-t border-[#F1F2F4] pt-4"
                    >
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-[#6D7175]">
                          رابط المتجر (Store URL)
                        </label>
                        <input
                          type="url"
                          required
                          dir="ltr"
                          value={storeUrlInput}
                          onChange={(e) => setStoreUrlInput(e.target.value)}
                          className="w-full rounded-lg border border-[#C9CCCF] bg-[#FAFBFB] px-3 py-1.5 font-mono-data text-xs text-[#202223] outline-none focus:border-[#008060] focus:bg-white"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-[#6D7175]">
                          مفتاح API / OAuth Token
                        </label>
                        <input
                          type="text"
                          required
                          dir="ltr"
                          value={apiKeyInput}
                          onChange={(e) => setApiKeyInput(e.target.value)}
                          className="w-full rounded-lg border border-[#C9CCCF] bg-[#FAFBFB] px-3 py-1.5 font-mono-data text-xs text-[#202223] outline-none focus:border-[#008060] focus:bg-white"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <button
                          type="submit"
                          className="rounded-lg bg-[#008060] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#006E52]"
                        >
                          حفظ وتفعيل الربط
                        </button>
                        {isConnected && (
                          <button
                            type="button"
                            onClick={() => handleDisconnect(item)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#D72C0D] hover:underline"
                          >
                            <Unplug className="h-3.5 w-3.5" />
                            <span>فصل</span>
                          </button>
                        )}
                      </div>
                    </form>
                  )}
                </div>

                {!isEditing && (
                  <div className="mt-5 flex items-center justify-between gap-2 border-t border-[#F1F2F4] pt-4">
                    <button
                      type="button"
                      onClick={() => openConfig(item)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#C9CCCF] bg-white px-3.5 py-2 text-xs font-semibold text-[#202223] hover:bg-[#F6F6F7] whitespace-nowrap"
                    >
                      <Link2 className="h-3.5 w-3.5" />
                      <span>{isConnected ? 'إعدادات الربط' : 'ربط المتجر الآن'}</span>
                    </button>

                    {isConnected && (
                      <button
                        type="button"
                        onClick={() => handleSyncNow(item)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#008060] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#006E52] whitespace-nowrap"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>استيراد منتج</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
