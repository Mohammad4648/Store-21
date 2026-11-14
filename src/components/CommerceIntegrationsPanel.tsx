import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Clock,
  Link2,
  RefreshCw,
  ShieldCheck,
  Unplug,
  X,
} from 'lucide-react';
import { UI_COPY } from '../i18n/translations';
import {
  IntegrationStatus,
  Language,
  PlatformId,
  PlatformIntegration,
  StoreChannel,
  SyncedStoreOrder,
} from '../types/commerce';
import { PlatformLogo } from './BrandIcons';

interface CommerceIntegrationsPanelProps {
  lang: Language;
  integrations: PlatformIntegration[];
  channels: StoreChannel[];
  defaultChannelId?: string;
  onConnect: (
    platform: PlatformId,
    payload: {
      storeUrl: string;
      token: string;
      consumerKey?: string;
      consumerSecret?: string;
      channelId: string;
    }
  ) => Promise<{ ok: boolean; error?: string }>;
  onSync: (platform: PlatformId) => Promise<{ ok: boolean; error?: string }>;
  onDisconnect: (platform: PlatformId) => Promise<void>;
  onFetchOrders: (platform: PlatformId) => Promise<{ ok: boolean; orders?: SyncedStoreOrder[]; error?: string }>;
}

export const CommerceIntegrationsPanel: React.FC<CommerceIntegrationsPanelProps> = ({
  lang,
  integrations,
  channels,
  defaultChannelId,
  onConnect,
  onSync,
  onDisconnect,
  onFetchOrders,
}) => {
  const t = UI_COPY[lang];
  const [configuring, setConfiguring] = useState<PlatformId | null>(null);
  const [storeUrl, setStoreUrl] = useState('');
  const [token, setToken] = useState('');
  const [consumerKey, setConsumerKey] = useState('');
  const [consumerSecret, setConsumerSecret] = useState('');
  const [channelId, setChannelId] = useState(defaultChannelId || channels[0]?.id || '');
  const [submitting, setSubmitting] = useState(false);
  const [syncingId, setSyncingId] = useState<PlatformId | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [ordersModal, setOrdersModal] = useState<{
    platform: PlatformId;
    orders: SyncedStoreOrder[];
    error?: string;
  } | null>(null);

  const statusMeta: Record<
    IntegrationStatus,
    { labelAr: string; labelEn: string; cls: string; Icon: React.ComponentType<{ className?: string }> }
  > = {
    connected: {
      labelAr: 'متصل',
      labelEn: 'Connected',
      cls: 'text-[#059669]',
      Icon: CheckCircle2,
    },
    disconnected: {
      labelAr: 'غير متصل',
      labelEn: 'Disconnected',
      cls: 'text-[#6B7280]',
      Icon: Unplug,
    },
    pending: {
      labelAr: 'قيد التحقق',
      labelEn: 'Pending',
      cls: 'text-[#B45309]',
      Icon: Clock,
    },
    failed: {
      labelAr: 'فشل الاتصال',
      labelEn: 'Failed',
      cls: 'text-[#DC2626]',
      Icon: AlertTriangle,
    },
  };

  const openEditor = (item: PlatformIntegration) => {
    setConfiguring(item.id);
    setStoreUrl(
      item.storeUrl ||
        (item.id === 'salla'
          ? 'https://api.salla.dev/admin/v2'
          : item.id === 'zid'
          ? 'https://api.zid.sa/v1'
          : '')
    );
    setToken('');
    setConsumerKey('');
    setConsumerSecret('');
    setChannelId(defaultChannelId || item.channelId || channels[0]?.id || '');
    setFeedback(null);
  };

  const handleSubmit = async (e: React.FormEvent, platform: PlatformId) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    const res = await onConnect(platform, {
      storeUrl,
      token,
      consumerKey,
      consumerSecret,
      channelId,
    });
    setSubmitting(false);
    if (res.ok) {
      setConfiguring(null);
      setFeedback({
        type: 'ok',
        text:
          lang === 'ar'
            ? 'تم التحقق من الاتصال بالمتجر ومزامنة المنتجات داخل القناة.'
            : 'Store verified via backend API and products synced into the channel.',
      });
    } else {
      setFeedback({
        type: 'err',
        text: res.error || (lang === 'ar' ? 'فشل التحقق من API المتجر.' : 'API verification failed.'),
      });
    }
  };

  const handleSync = async (platform: PlatformId) => {
    setSyncingId(platform);
    setFeedback(null);
    const res = await onSync(platform);
    setSyncingId(null);
    if (res.ok) {
      setFeedback({
        type: 'ok',
        text: lang === 'ar' ? 'تمت مزامنة الأسعار والمخزون بنجاح.' : 'Prices & stock synchronized.',
      });
    } else {
      setFeedback({
        type: 'err',
        text: res.error || (lang === 'ar' ? 'تعذر التزامن.' : 'Sync failed.'),
      });
    }
  };

  const handleViewOrders = async (platform: PlatformId) => {
    const res = await onFetchOrders(platform);
    setOrdersModal({
      platform,
      orders: res.orders || [],
      error: res.error,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2.5 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] p-3.5 text-xs text-[#4B5563]">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#059669]" />
        <p>
          {lang === 'ar'
            ? 'تُرسل بيانات الربط ومفاتيح API مباشرة إلى الخادم للتحقق الفعلي من واجهة المتجر ولا تُخزن في المتصفح. المنتجات المستوردة تظهر تلقائياً كمنشورات داخل القناة المختارة.'
            : 'Store API tokens are sent strictly to the backend server, verified live against the platform API, and never persisted in frontend code. Imported items publish naturally inside the selected channel.'}
        </p>
      </div>

      {feedback && (
        <div
          className={`rounded-xl border px-4 py-3 text-xs font-medium ${
            feedback.type === 'ok'
              ? 'border-[#A7F3D0] bg-[#ECFDF5] text-[#065F46]'
              : 'border-[#FECACA] bg-[#FEF2F2] text-[#991B1B]'
          }`}
        >
          {feedback.text}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {integrations.map((item) => {
          const meta = statusMeta[item.status];
          const StatusIcon = meta.Icon;
          const isEditing = configuring === item.id;
          const targetChannel = channels.find((c) => c.id === (item.channelId || defaultChannelId));

          return (
            <div
              key={item.id}
              className="flex flex-col justify-between rounded-xl border border-[#E5E7EB] bg-white p-5"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <PlatformLogo id={item.id} className="h-9 w-9 shrink-0" />
                    <div>
                      <h3 className="font-display text-sm font-bold text-[#141518]">{item.name}</h3>
                      <p className="text-[11px] text-[#6B7280]">
                        {targetChannel
                          ? lang === 'ar'
                            ? targetChannel.name
                            : targetChannel.nameEn
                          : 'Store-21'}
                      </p>
                    </div>
                  </div>

                  <span className={`inline-flex items-center gap-1 text-xs font-semibold ${meta.cls} whitespace-nowrap`}>
                    <StatusIcon className="h-3.5 w-3.5" />
                    <span>{lang === 'ar' ? meta.labelAr : meta.labelEn}</span>
                  </span>
                </div>

                <p className="mt-3 text-xs leading-relaxed text-[#4B5563]">
                  {lang === 'ar' ? item.subtitle : item.subtitleEn}
                </p>

                {item.status === 'failed' && item.lastError && (
                  <div className="mt-2.5 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-[11px] text-[#991B1B]">
                    {item.lastError}
                  </div>
                )}

                {item.status === 'connected' && (
                  <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg border border-[#E5E7EB] bg-[#F8F9FA] p-2.5 text-[11px] text-[#4B5563]">
                    <div>
                      <span className="text-[#6B7280]">{lang === 'ar' ? 'المنتجات:' : 'Products:'} </span>
                      <span className="font-mono-data font-bold text-[#141518]">{item.syncedProductsCount}</span>
                    </div>
                    <div>
                      <span className="text-[#6B7280]">{lang === 'ar' ? 'آخر مزامنة:' : 'Synced:'} </span>
                      <span className="font-mono-data">{item.lastSync}</span>
                    </div>
                  </div>
                )}

                {isEditing && (
                  <form
                    onSubmit={(e) => handleSubmit(e, item.id)}
                    className="mt-4 space-y-2.5 border-t border-[#F3F4F6] pt-3"
                  >
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-[#374151]">
                        {lang === 'ar' ? 'رابط المتجر / API Base URL' : 'Store URL / API Base'}
                      </label>
                      <input
                        type="url"
                        required
                        dir="ltr"
                        value={storeUrl}
                        onChange={(e) => setStoreUrl(e.target.value)}
                        placeholder="https://your-store.myshopify.com"
                        className="w-full rounded-lg border border-[#D1D5DB] px-3 py-1.5 font-mono-data text-xs text-[#141518]"
                      />
                    </div>

                    {item.id === 'woocommerce' ? (
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <input
                          type="password"
                          required
                          dir="ltr"
                          value={consumerKey}
                          onChange={(e) => setConsumerKey(e.target.value)}
                          placeholder="Consumer Key (ck_...)"
                          className="w-full rounded-lg border border-[#D1D5DB] px-3 py-1.5 font-mono-data text-xs"
                        />
                        <input
                          type="password"
                          required
                          dir="ltr"
                          value={consumerSecret}
                          onChange={(e) => setConsumerSecret(e.target.value)}
                          placeholder="Consumer Secret (cs_...)"
                          className="w-full rounded-lg border border-[#D1D5DB] px-3 py-1.5 font-mono-data text-xs"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="mb-1 block text-[11px] font-semibold text-[#374151]">
                          {lang === 'ar' ? 'رمز OAuth / API Access Token' : 'OAuth / Admin Access Token'}
                        </label>
                        <input
                          type="password"
                          required
                          dir="ltr"
                          value={token}
                          onChange={(e) => setToken(e.target.value)}
                          placeholder={item.id === 'shopify' ? 'shpat_...' : 'Bearer token...'}
                          className="w-full rounded-lg border border-[#D1D5DB] px-3 py-1.5 font-mono-data text-xs"
                        />
                      </div>
                    )}

                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-[#374151]">
                        {lang === 'ar' ? 'القناة المستقبلة للمنتجات' : 'Target Channel'}
                      </label>
                      <select
                        value={channelId}
                        onChange={(e) => setChannelId(e.target.value)}
                        className="w-full rounded-lg border border-[#D1D5DB] bg-white px-3 py-1.5 text-xs text-[#141518]"
                      >
                        {channels.map((c) => (
                          <option key={c.id} value={c.id}>
                            {lang === 'ar' ? c.name : c.nameEn}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setConfiguring(null)}
                        className="rounded-lg border border-[#D1D5DB] px-3 py-1.5 text-xs font-semibold text-[#4B5563]"
                      >
                        {t.common.cancel}
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="rounded-lg bg-[#059669] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#047857] disabled:opacity-50"
                      >
                        {submitting
                          ? lang === 'ar'
                            ? 'جاري التحقق...'
                            : 'Verifying...'
                          : lang === 'ar'
                          ? 'تحقق وربط المتجر'
                          : 'Verify & Connect'}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {!isEditing && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#F3F4F6] pt-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditor(item)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#D1D5DB] bg-white px-3 py-1.5 text-xs font-semibold text-[#141518] hover:border-[#059669] hover:text-[#059669]"
                    >
                      <Link2 className="h-3.5 w-3.5" />
                      <span>
                        {item.status === 'connected'
                          ? lang === 'ar'
                            ? 'إعدادات'
                            : 'Configure'
                          : t.common.connect}
                      </span>
                    </button>

                    {item.status === 'connected' && (
                      <>
                        <button
                          type="button"
                          disabled={syncingId === item.id}
                          onClick={() => handleSync(item.id)}
                          className="inline-flex items-center gap-1 rounded-lg bg-[#ECFDF5] px-3 py-1.5 text-xs font-semibold text-[#059669] hover:bg-[#D1FAE5]"
                        >
                          <RefreshCw className={`h-3.5 w-3.5 ${syncingId === item.id ? 'animate-spin' : ''}`} />
                          <span>{t.common.syncNow}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleViewOrders(item.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#E5E7EB] px-2.5 py-1.5 text-xs font-semibold text-[#4B5563] hover:text-[#141518]"
                        >
                          <ClipboardList className="h-3.5 w-3.5" />
                          <span>{lang === 'ar' ? 'الطلبات' : 'Orders'}</span>
                        </button>
                      </>
                    )}
                  </div>

                  {item.status === 'connected' && (
                    <button
                      type="button"
                      onClick={() => onDisconnect(item.id)}
                      className="text-xs font-semibold text-[#DC2626] hover:underline"
                    >
                      {t.common.disconnect}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Live Store Orders Modal */}
      {ordersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-xl">
            <div className="mb-3 flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <h4 className="font-display text-sm font-bold text-[#141518]">
                {lang === 'ar' ? 'طلبات المتجر المربوط' : 'Synced Store Orders'} · {ordersModal.platform}
              </h4>
              <button type="button" onClick={() => setOrdersModal(null)} className="rounded p-1 text-[#6B7280]">
                <X className="h-4 w-4" />
              </button>
            </div>
            {ordersModal.error ? (
              <p className="text-xs text-[#DC2626]">{ordersModal.error}</p>
            ) : ordersModal.orders.length === 0 ? (
              <p className="text-xs text-[#6B7280]">
                {lang === 'ar' ? 'لا توجد طلبات واردة من هذا المتجر حالياً.' : 'No incoming store orders returned.'}
              </p>
            ) : (
              <div className="divide-y divide-[#F3F4F6] text-xs">
                {ordersModal.orders.map((ord) => (
                  <div key={ord.id} className="flex items-center justify-between py-2.5">
                    <div>
                      <div className="font-mono-data font-bold text-[#141518]">{ord.externalOrderNumber}</div>
                      <div className="text-[#6B7280]">{ord.customerName} · {ord.createdAt}</div>
                    </div>
                    <div className="text-end">
                      <div className="font-mono-data font-bold text-[#059669]">${ord.totalUSD.toLocaleString()}</div>
                      <div className="text-[#6B7280]">{ord.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
