import React from 'react';
import { Store, User, Wallet as WalletIcon } from 'lucide-react';
import {
  ActiveSession,
  CartItem,
  CurrencyBalance,
  ExternalWalletConnection,
  Language,
  OrderRecord,
  PlatformId,
  PlatformIntegration,
  StoreChannel,
  SupportedCurrency,
  SupportTicket,
  SyncedStoreOrder,
  UserProfile,
  WalletProviderId,
  WalletTransactionRecord,
} from '../types/commerce';
import { AccountPage } from './AccountPage';
import { CommerceIntegrationsPanel } from './CommerceIntegrationsPanel';
import { WalletPage } from './WalletPage';

export type ProfileSubTab = 'account' | 'wallet' | 'seller';

interface ProfilePageProps {
  lang: Language;
  activeTab: ProfileSubTab;
  onChangeTab: (tab: ProfileSubTab) => void;
  onChangeLang: (lang: Language) => void;
  profile: UserProfile;
  sessions: ActiveSession[];
  supportTickets: SupportTicket[];
  integrations: PlatformIntegration[];
  channels: StoreChannel[];
  internalBalances: CurrencyBalance[];
  externalWallets: ExternalWalletConnection[];
  transactions: WalletTransactionRecord[];
  orders: OrderRecord[];
  cart: CartItem[];
  walletConnectConfigured: boolean;
  onSaveProfile: (next: UserProfile) => Promise<void>;
  onRevokeSession: (sessionId: string) => Promise<void>;
  onSubmitSupport: (subject: string, message: string) => Promise<void>;
  onLogout: () => void;
  onOpenChannel: (channelId: string) => void;
  onConnectProvider: (provider: WalletProviderId) => Promise<{ ok: boolean; message: string }>;
  onConnectReadOnlyAddress: (
    address: string,
    networkKind: 'evm' | 'solana'
  ) => Promise<{ ok: boolean; message: string }>;
  onRefreshExternalBalances: (address: string) => Promise<void>;
  onDisconnectExternalWallet: (address: string) => void;
  onVerifyTxDeposit: (
    txHash: string,
    currency: SupportedCurrency,
    amountUSD: number,
    chainIdHex?: string
  ) => Promise<{ ok: boolean; message: string }>;
  onSubmitExternalWalletPayment: (
    walletAddress: string,
    currency: 'ETH' | 'USDT' | 'USDC',
    recipientAddress: string,
    amountUSD: number,
    forCart: boolean
  ) => Promise<{ ok: boolean; message: string }>;
  onSubmitCartOrderIntent: (note: string) => Promise<{ ok: boolean; message: string }>;
  onWithdrawInternal: (
    currency: SupportedCurrency,
    amount: number,
    destination: string
  ) => Promise<{ ok: boolean; message: string }>;
  onRemoveCartItem: (productId: string) => void;
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

export const ProfilePage: React.FC<ProfilePageProps> = ({
  lang,
  activeTab,
  onChangeTab,
  onChangeLang,
  profile,
  sessions,
  supportTickets,
  integrations,
  channels,
  internalBalances,
  externalWallets,
  transactions,
  orders,
  cart,
  walletConnectConfigured,
  onSaveProfile,
  onRevokeSession,
  onSubmitSupport,
  onLogout,
  onOpenChannel,
  onConnectProvider,
  onConnectReadOnlyAddress,
  onRefreshExternalBalances,
  onDisconnectExternalWallet,
  onVerifyTxDeposit,
  onSubmitExternalWalletPayment,
  onSubmitCartOrderIntent,
  onWithdrawInternal,
  onRemoveCartItem,
  onConnectIntegration,
  onSyncIntegration,
  onDisconnectIntegration,
  onFetchIntegrationOrders,
}) => {
  const tabs: {
    id: ProfileSubTab;
    ar: string;
    en: string;
    Icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'account', ar: 'الحساب والإعدادات', en: 'Account & Settings', Icon: User },
    { id: 'wallet', ar: 'المحفظة والمعاملات', en: 'Wallet & History', Icon: WalletIcon },
    { id: 'seller', ar: 'إدارة القنوات والمتاجر', en: 'Channel & Seller Tools', Icon: Store },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Clean Unified Profile Section Switcher */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#E5E7EB] bg-white p-2.5 sm:flex-row sm:items-center sm:justify-between sm:p-3">
        <div
          role="tablist"
          aria-label={lang === 'ar' ? 'أقسام الملف الشخصي' : 'Profile sections'}
          className="flex items-center gap-1.5 overflow-x-auto"
        >
          {tabs.map(({ id, ar, en, Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onChangeTab(id)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap sm:px-4 ${
                  active
                    ? 'bg-[#059669] text-white'
                    : 'bg-[#F8F9FA] text-[#4B5563] hover:text-[#141518]'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{lang === 'ar' ? ar : en}</span>
              </button>
            );
          })}
        </div>

        {cart.length > 0 && activeTab !== 'wallet' && (
          <button
            type="button"
            onClick={() => onChangeTab('wallet')}
            className="self-start text-xs font-semibold text-[#059669] hover:underline whitespace-nowrap sm:self-auto"
          >
            {lang === 'ar'
              ? `إتمام طلب السلة (${cart.reduce((s, c) => s + c.quantity, 0)})`
              : `Checkout Cart (${cart.reduce((s, c) => s + c.quantity, 0)})`}
          </button>
        )}
      </div>

      {activeTab === 'account' && (
        <AccountPage
          lang={lang}
          onChangeLang={onChangeLang}
          profile={profile}
          sessions={sessions}
          supportTickets={supportTickets}
          onSaveProfile={onSaveProfile}
          onRevokeSession={onRevokeSession}
          onSubmitSupport={onSubmitSupport}
          onLogout={onLogout}
        />
      )}

      {activeTab === 'wallet' && (
        <WalletPage
          lang={lang}
          internalBalances={internalBalances}
          externalWallets={externalWallets}
          transactions={transactions}
          orders={orders}
          cart={cart}
          walletConnectConfigured={walletConnectConfigured}
          onConnectProvider={onConnectProvider}
          onConnectReadOnlyAddress={onConnectReadOnlyAddress}
          onRefreshExternalBalances={onRefreshExternalBalances}
          onDisconnectExternalWallet={onDisconnectExternalWallet}
          onVerifyTxDeposit={onVerifyTxDeposit}
          onSubmitExternalWalletPayment={onSubmitExternalWalletPayment}
          onSubmitCartOrderIntent={onSubmitCartOrderIntent}
          onWithdrawInternal={onWithdrawInternal}
          onRemoveCartItem={onRemoveCartItem}
        />
      )}

      {activeTab === 'seller' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
            <h2 className="font-display text-base font-bold text-[#141518]">
              {lang === 'ar' ? 'قنواتك النشطة' : 'Your Channels'}
            </h2>
            <p className="mt-1 text-xs text-[#6B7280]">
              {lang === 'ar'
                ? 'انتقل مباشرة إلى إدارة المنشورات والمنتجات والبث المباشر داخل القناة.'
                : 'Open any channel directly to manage posts, products, live sessions, and members.'}
            </p>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {channels.slice(0, 4).map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => onOpenChannel(ch.id)}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] p-3.5 text-start hover:border-[#059669]"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <img
                      src={ch.avatarImage}
                      alt={lang === 'ar' ? ch.name : ch.nameEn}
                      referrerPolicy="no-referrer"
                      className="h-10 w-10 shrink-0 rounded-full object-cover"
                    />
                    <div className="min-w-0">
                      <div className="truncate text-xs font-bold text-[#141518]">
                        {lang === 'ar' ? ch.name : ch.nameEn}
                      </div>
                      <div className="text-[11px] text-[#6B7280] tabular-nums">
                        {ch.followersCount.toLocaleString()} {lang === 'ar' ? 'مشترك' : 'subscribers'}
                      </div>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-[#059669]">
                    {lang === 'ar' ? 'إدارة' : 'Open'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
            <h2 className="font-display text-base font-bold text-[#141518]">
              {lang === 'ar' ? 'ربط المتاجر الخارجية بالقنوات' : 'External Store Integrations'}
            </h2>
            <p className="mt-1 mb-4 text-xs text-[#6B7280]">
              {lang === 'ar'
                ? 'مزامنة منتجات Shopify و WooCommerce وسلة وزد مع قنوات Store-21.'
                : 'Sync catalogs and orders from Shopify, WooCommerce, Salla, or Zid into channels.'}
            </p>
            <CommerceIntegrationsPanel
              lang={lang}
              integrations={integrations}
              channels={channels}
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
