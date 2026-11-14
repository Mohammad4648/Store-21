import React, { useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  ExternalLink,
  History,
  Link2,
  Receipt,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Unplug,
  Wallet as WalletIcon,
} from 'lucide-react';
import { UI_COPY } from '../i18n/translations';
import {
  CartItem,
  CurrencyBalance,
  ExternalWalletConnection,
  Language,
  OrderRecord,
  SupportedCurrency,
  WalletProviderId,
  WalletTransactionRecord,
} from '../types/commerce';
import { WalletProviderLogo } from './BrandIcons';

interface WalletPageProps {
  lang: Language;
  internalBalances: CurrencyBalance[];
  externalWallets: ExternalWalletConnection[];
  transactions: WalletTransactionRecord[];
  orders: OrderRecord[];
  cart: CartItem[];
  walletConnectConfigured: boolean;
  onConnectProvider: (provider: WalletProviderId) => Promise<{ ok: boolean; message: string }>;
  onConnectReadOnlyAddress: (address: string, networkKind: 'evm' | 'solana') => Promise<{ ok: boolean; message: string }>;
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
}

const WALLET_PROVIDERS: {
  id: WalletProviderId;
  name: string;
  networkLabel: string;
  descAr: string;
  descEn: string;
}[] = [
  {
    id: 'metamask',
    name: 'MetaMask',
    networkLabel: 'Ethereum · Polygon · Base · Arbitrum',
    descAr: 'اتصال مباشر عبر ملحق المتصفح EIP-1193 / EIP-6963',
    descEn: 'Direct browser extension handshake (EIP-1193 / EIP-6963)',
  },
  {
    id: 'trust',
    name: 'Trust Wallet',
    networkLabel: 'Multi-Chain EVM',
    descAr: 'محفظة متصفح وجوال متوافقة مع شبكات EVM',
    descEn: 'EVM browser extension & mobile multi-chain wallet',
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    networkLabel: 'Ethereum · Base L2',
    descAr: 'اتصال مباشر لشبكة إيثيريوم وشبكة Base',
    descEn: 'Native Ethereum & Base Layer-2 browser extension',
  },
  {
    id: 'walletconnect',
    name: 'WalletConnect',
    networkLabel: 'QR Protocol v2',
    descAr: 'ربط محافظ الجوال عبر بروتوكول WalletConnect v2',
    descEn: 'Connect mobile wallets via WalletConnect v2 project ID',
  },
  {
    id: 'solana',
    name: 'Solana (Phantom / Solflare)',
    networkLabel: 'Solana Mainnet',
    descAr: 'رصيد SOL الفعلي عبر Solana Mainnet JSON-RPC',
    descEn: 'Native SOL balance via Solana Mainnet JSON-RPC',
  },
];

export const WalletPage: React.FC<WalletPageProps> = ({
  lang,
  internalBalances,
  externalWallets,
  transactions,
  orders,
  cart,
  walletConnectConfigured,
  onConnectProvider,
  onConnectReadOnlyAddress,
  onRefreshExternalBalances,
  onDisconnectExternalWallet,
  onVerifyTxDeposit,
  onSubmitExternalWalletPayment,
  onSubmitCartOrderIntent,
  onWithdrawInternal,
  onRemoveCartItem,
}) => {
  const t = UI_COPY[lang];
  const [actionTab, setActionTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [historyTab, setHistoryTab] = useState<'transactions' | 'payments'>('transactions');

  // Read-only lookup state
  const [watchAddress, setWatchAddress] = useState('');
  const [watchKind, setWatchKind] = useState<'evm' | 'solana'>('evm');

  // Deposit / verify tx state
  const [depositHash, setDepositHash] = useState('');
  const [depositCurrency, setDepositCurrency] = useState<SupportedCurrency>('USDT');
  const [depositAmount, setDepositAmount] = useState('50');
  const [depositChainHex, setDepositChainHex] = useState('0x1');

  // Direct on-chain pay / deposit from connected EIP-1193 wallet
  const [recipientAddr, setRecipientAddr] = useState('0x000000000000000000000000000000000000dead');
  const [onChainAmountUSD, setOnChainAmountUSD] = useState('25');

  // Withdrawal state
  const [withdrawCurrency, setWithdrawCurrency] = useState<SupportedCurrency>('USDT');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawDest, setWithdrawDest] = useState('');

  // Cart checkout note
  const [checkoutNote, setCheckoutNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const internalTotalUSD = useMemo(
    () => internalBalances.reduce((sum, b) => sum + b.amount * b.usdRate, 0),
    [internalBalances]
  );

  const externalTotalUSD = useMemo(
    () =>
      externalWallets.reduce(
        (sum, w) => sum + w.balances.reduce((s, b) => s + b.amount * b.usdRate, 0),
        0
      ),
    [externalWallets]
  );

  const combinedTotalUSD = internalTotalUSD + externalTotalUSD;
  const cartTotalUSD = cart.reduce((sum, item) => sum + item.product.priceUSD * item.quantity, 0);
  const activeEvmWallet = externalWallets.find((w) => w.address.startsWith('0x') && !w.readOnly);

  const runAction = async (fn: () => Promise<{ ok: boolean; message: string }>) => {
    setBusy(true);
    setFeedback(null);
    const res = await fn();
    setBusy(false);
    setFeedback({ type: res.ok ? 'ok' : 'err', text: res.message });
  };

  return (
    <div className="space-y-6">
      {/* Security & Honesty Notice */}
      <div className="flex items-start gap-3 rounded-2xl border border-[#E5E7EB] bg-white p-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#059669]" />
        <div className="text-xs leading-relaxed text-[#4B5563]">
          <span className="font-bold text-[#141518]">
            {lang === 'ar' ? 'حماية الأصول والشفافية الكاملة: ' : 'Asset Safety & Verified On-Chain Data: '}
          </span>
          {lang === 'ar'
            ? 'لا تطلب Store-21 عبارات الاسترداد (Seed Phrase) أو المفاتيح الخاصة إطلاقاً. جميع الأرصدة الخارجية تُجلب مباشرة من الشبكة، ويفصل النظام تماماً بين رصيد المنصة الداخلي ورصيد محافظك الخارجية، كما يتطلب كل تحويل موافقتك الصريحة.'
            : 'Store-21 never requests or stores seed phrases or private keys. External wallet balances are fetched live via blockchain RPC, internal platform balances are strictly separated from external wallet balances, and every transaction requires explicit wallet approval.'}
        </div>
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

      {/* Portfolio Overview Cards (Strictly Separating Internal vs External) */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-[#E5E7EB] bg-[#141518] p-5 text-white">
          <div className="text-xs font-medium text-[#9CA3AF]">
            {lang === 'ar' ? 'إجمالي المحفظة المجمّع' : 'Total Portfolio Balance'}
          </div>
          <div className="mt-2 font-mono-data text-3xl font-extrabold text-white">
            ${combinedTotalUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-2 text-[11px] text-[#D1D5DB]">
            {lang === 'ar'
              ? 'يشمل الأرصدة الداخلية الموثقة + المحافظ الخارجية المتصلة'
              : 'Verified internal balance + live external connected wallets'}
          </div>
        </div>

        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
          <div className="flex items-center justify-between text-xs text-[#6B7280]">
            <span>{lang === 'ar' ? 'رصيد المنصة الداخلي' : 'Internal Platform Balance'}</span>
            <span className="font-semibold text-[#059669]">Store-21 Ledger</span>
          </div>
          <div className="mt-2 font-mono-data text-2xl font-extrabold text-[#141518]">
            ${internalTotalUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-2 text-[11px] text-[#6B7280]">
            {lang === 'ar'
              ? 'يُحدَّث فقط بعد التحقق من معاملات الإيداع على البلوكشين.'
              : 'Credits only after real on-chain transaction receipt verification.'}
          </div>
        </div>

        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
          <div className="flex items-center justify-between text-xs text-[#6B7280]">
            <span>{lang === 'ar' ? 'رصيد المحافظ الخارجية المتصلة' : 'Connected External Wallets'}</span>
            <span className="font-mono-data font-semibold text-[#141518]">
              {externalWallets.length} {lang === 'ar' ? 'متصلة' : 'connected'}
            </span>
          </div>
          <div className="mt-2 font-mono-data text-2xl font-extrabold text-[#141518]">
            ${externalTotalUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-2 text-[11px] text-[#6B7280]">
            {lang === 'ar'
              ? 'تبقى الأصول في محفظتك الخاصة وتُقرأ مباشرة عبر RPC.'
              : 'Custodied in your own wallet; queried directly via JSON-RPC.'}
          </div>
        </div>
      </div>

      {/* Individual Asset Balances (USDT, USDC, ETH, SOL) */}
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
        <h2 className="font-display text-base font-bold text-[#141518]">
          {lang === 'ar' ? 'أرصدة العملات المدعومة (الداخلية + الخارجية)' : 'Supported Asset Balances (Internal vs External)'}
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {internalBalances.map((asset) => {
            const externalAmt = externalWallets.reduce((sum, w) => {
              const found = w.balances.find((b) => b.currency === asset.currency);
              return sum + (found ? found.amount : 0);
            }, 0);

            return (
              <div
                key={asset.currency}
                className="rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono-data text-sm font-extrabold text-[#141518]">
                    {asset.currency}
                  </span>
                  <span className="text-[11px] text-[#6B7280]">{asset.networkLabel}</span>
                </div>

                <div className="mt-3 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#6B7280]">{lang === 'ar' ? 'داخلي:' : 'Internal:'}</span>
                    <span className="font-mono-data font-bold text-[#141518]">
                      {asset.amount.toFixed(asset.currency === 'ETH' || asset.currency === 'SOL' ? 4 : 2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#6B7280]">{lang === 'ar' ? 'خارجي:' : 'External:'}</span>
                    <span className="font-mono-data font-bold text-[#059669]">
                      {externalAmt.toFixed(asset.currency === 'ETH' || asset.currency === 'SOL' ? 4 : 2)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pending Cart Order Checkout */}
      {cart.length > 0 && (
        <div className="rounded-2xl border border-[#A7F3D0] bg-[#ECFDF5]/60 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#A7F3D0] pb-3">
            <div>
              <h2 className="font-display text-base font-bold text-[#141518]">
                {lang === 'ar' ? 'إتمام طلب سلة المشتريات' : 'Cart Checkout'}
              </h2>
              <p className="text-xs text-[#4B5563]">
                {lang === 'ar'
                  ? 'ادفع عبر محفظتك المتصلة مع توقيع المعاملة أو أرسل طلب دفع للتحقق الخلفي.'
                  : 'Sign an on-chain payment with a connected wallet or submit a verifiable order intent.'}
              </p>
            </div>
            <div className="font-mono-data text-xl font-extrabold text-[#059669]">
              ${cartTotalUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="mt-3 divide-y divide-[#D1FAE5]">
            {cart.map((item) => (
              <div key={`${item.product.id}-${item.selectedFinish}`} className="flex items-center justify-between py-2.5 text-xs">
                <div className="flex items-center gap-2.5">
                  <img
                    src={item.product.image}
                    alt={lang === 'ar' ? item.product.title : item.product.titleEn}
                    referrerPolicy="no-referrer"
                    className="h-9 w-11 rounded object-cover"
                  />
                  <div>
                    <div className="font-bold text-[#141518]">
                      {lang === 'ar' ? item.product.title : item.product.titleEn}
                    </div>
                    <div className="font-mono-data text-[#4B5563]">
                      {item.quantity} × ${item.product.priceUSD.toLocaleString()}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveCartItem(item.product.id)}
                  aria-label="Remove item"
                  className="text-[#6B7280] hover:text-[#DC2626]"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-12">
            <input
              type="text"
              value={checkoutNote}
              onChange={(e) => setCheckoutNote(e.target.value)}
              placeholder={lang === 'ar' ? 'عنوان التسليم أو ملاحظات للبائع...' : 'Delivery details or order note...'}
              className="rounded-lg border border-[#D1D5DB] bg-white px-3 py-2 text-xs md:col-span-6"
            />
            <button
              type="button"
              disabled={busy || !activeEvmWallet}
              onClick={() =>
                activeEvmWallet &&
                runAction(() =>
                  onSubmitExternalWalletPayment(
                    activeEvmWallet.address,
                    'ETH',
                    recipientAddr,
                    cartTotalUSD,
                    true
                  )
                )
              }
              className="rounded-lg bg-[#059669] px-4 py-2 text-xs font-semibold text-white hover:bg-[#047857] disabled:opacity-45 md:col-span-3"
            >
              {activeEvmWallet
                ? lang === 'ar'
                  ? 'توقيع الدفع بالمحفظة'
                  : 'Pay via Connected Wallet'
                : lang === 'ar'
                ? 'اربط محفظة للدفع الفوري'
                : 'Connect Wallet to Pay'}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => runAction(() => onSubmitCartOrderIntent(checkoutNote))}
              className="rounded-lg border border-[#141518] bg-white px-4 py-2 text-xs font-semibold text-[#141518] hover:bg-[#F3F4F6] md:col-span-3"
            >
              {lang === 'ar' ? 'تسجيل طلب (بانتظار الدفع)' : 'Create Pending Order'}
            </button>
          </div>
        </div>
      )}

      {/* External Wallet Connections + Deposit / Withdraw Workspace */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* External Wallet Connections (7 cols) */}
        <div className="space-y-4 rounded-2xl border border-[#E5E7EB] bg-white p-5 lg:col-span-7">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-[#141518]">
              {lang === 'ar' ? 'ربط المحافظ الخارجية (Web3)' : 'External Wallet Connections'}
            </h2>
            <span className="text-[11px] font-semibold text-[#6B7280]">
              EIP-6963 · EIP-1193 · Solana
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {WALLET_PROVIDERS.map((prov) => {
              const isWalletConnectDisabled = prov.id === 'walletconnect' && !walletConnectConfigured;
              return (
                <div
                  key={prov.id}
                  className="flex flex-col justify-between rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] p-3.5"
                >
                  <div className="flex items-start gap-3">
                    <WalletProviderLogo provider={prov.id} className="h-9 w-9 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#141518]">{prov.name}</div>
                      <div className="text-[11px] text-[#059669]">{prov.networkLabel}</div>
                      <p className="mt-1 text-[11px] leading-snug text-[#6B7280]">
                        {lang === 'ar' ? prov.descAr : prov.descEn}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => runAction(() => onConnectProvider(prov.id))}
                    className={`mt-3 w-full rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                      isWalletConnectDisabled
                        ? 'border border-[#D1D5DB] bg-white text-[#4B5563]'
                        : 'bg-[#141518] text-white hover:bg-[#059669]'
                    }`}
                  >
                    {t.common.connect}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Read-Only Public Address RPC Verification */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!watchAddress.trim()) return;
              runAction(() => onConnectReadOnlyAddress(watchAddress.trim(), watchKind));
            }}
            className="space-y-2 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] p-4"
          >
            <div className="text-xs font-bold text-[#141518]">
              {lang === 'ar'
                ? 'استعلام رصيد عام بالمحفظة (للقراءة فقط عبر العنوان العام)'
                : 'Read-Only Public Wallet Lookup (Public Address Only)'}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                value={watchKind}
                onChange={(e) => setWatchKind(e.target.value as 'evm' | 'solana')}
                className="rounded-lg border border-[#D1D5DB] bg-white px-2.5 py-2 text-xs"
              >
                <option value="evm">EVM (0x...)</option>
                <option value="solana">Solana</option>
              </select>
              <input
                type="text"
                dir="ltr"
                value={watchAddress}
                onChange={(e) => setWatchAddress(e.target.value)}
                placeholder={watchKind === 'evm' ? '0x...' : 'Solana public address...'}
                className="flex-1 rounded-lg border border-[#D1D5DB] bg-white px-3 py-2 font-mono-data text-xs"
              />
              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center justify-center gap-1 rounded-lg bg-[#059669] px-4 py-2 text-xs font-semibold text-white hover:bg-[#047857]"
              >
                <Link2 className="h-3.5 w-3.5" />
                <span>{lang === 'ar' ? 'جلب الرصيد' : 'Fetch RPC'}</span>
              </button>
            </div>
          </form>

          {/* Active External Wallets List */}
          {externalWallets.length > 0 && (
            <div className="space-y-2.5 border-t border-[#E5E7EB] pt-4">
              <h3 className="text-xs font-bold text-[#141518]">
                {lang === 'ar' ? 'المحافظ المتصلة حالياً' : 'Active External Connections'}
              </h3>
              {externalWallets.map((w) => (
                <div
                  key={w.address}
                  className="rounded-xl border border-[#E5E7EB] bg-white p-3.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <WalletProviderLogo provider={w.provider} className="h-7 w-7 shrink-0" />
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#141518]">
                          <span>{w.label}</span>
                          <CheckCircle2 className="h-3.5 w-3.5 text-[#059669]" />
                          {w.readOnly && (
                            <span className="text-[11px] font-normal text-[#6B7280]">
                              ({lang === 'ar' ? 'قراءة فقط' : 'Read-Only'})
                            </span>
                          )}
                        </div>
                        <div className="font-mono-data text-[11px] text-[#6B7280]" dir="ltr">
                          {w.address.slice(0, 8)}...{w.address.slice(-6)} · {w.networkName}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onRefreshExternalBalances(w.address)}
                        aria-label="Refresh RPC balances"
                        className="rounded-lg border border-[#E5E7EB] p-1.5 text-[#4B5563] hover:text-[#059669]"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDisconnectExternalWallet(w.address)}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-2.5 py-1 text-[11px] font-semibold text-[#DC2626]"
                      >
                        <Unplug className="h-3 w-3" />
                        <span>{t.common.disconnect}</span>
                      </button>
                    </div>
                  </div>

                  {w.balanceError ? (
                    <p className="mt-2 text-[11px] text-[#DC2626]">{w.balanceError}</p>
                  ) : (
                    <div className="mt-2.5 flex flex-wrap gap-3 border-t border-[#F3F4F6] pt-2 text-xs">
                      {w.balances.map((b) => (
                        <div key={b.currency} className="font-mono-data">
                          <span className="font-bold text-[#141518]">{b.amount}</span>{' '}
                          <span className="text-[#6B7280]">{b.currency}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Deposit & Withdraw Panel (5 cols) */}
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 lg:col-span-5">
          <div className="grid grid-cols-2 gap-1 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] p-1">
            <button
              type="button"
              onClick={() => setActionTab('deposit')}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold ${
                actionTab === 'deposit' ? 'bg-[#059669] text-white' : 'text-[#4B5563]'
              }`}
            >
              <ArrowDownLeft className="h-3.5 w-3.5" />
              <span>{lang === 'ar' ? 'إيداع وتوثيق' : 'Deposit & Verify'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActionTab('withdraw')}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold ${
                actionTab === 'withdraw' ? 'bg-[#059669] text-white' : 'text-[#4B5563]'
              }`}
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
              <span>{lang === 'ar' ? 'سحب رصيد داخلي' : 'Withdraw'}</span>
            </button>
          </div>

          {actionTab === 'deposit' ? (
            <div className="mt-4 space-y-5">
              {/* Direct Web3 Deposit */}
              <div className="space-y-2.5 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] p-4">
                <div className="text-xs font-bold text-[#141518]">
                  {lang === 'ar' ? '1) إرسال معاملة عبر محفظة متصلة (موافقة صريحة)' : '1) Send via Connected Wallet (Explicit Approval)'}
                </div>
                <input
                  type="text"
                  dir="ltr"
                  value={recipientAddr}
                  onChange={(e) => setRecipientAddr(e.target.value)}
                  placeholder="Destination 0x address"
                  className="w-full rounded-lg border border-[#D1D5DB] bg-white px-3 py-1.5 font-mono-data text-xs"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    value={onChainAmountUSD}
                    onChange={(e) => setOnChainAmountUSD(e.target.value)}
                    placeholder="USD amount"
                    className="w-28 rounded-lg border border-[#D1D5DB] bg-white px-3 py-1.5 font-mono-data text-xs"
                  />
                  <button
                    type="button"
                    disabled={busy || !activeEvmWallet}
                    onClick={() =>
                      activeEvmWallet &&
                      runAction(() =>
                        onSubmitExternalWalletPayment(
                          activeEvmWallet.address,
                          'ETH',
                          recipientAddr,
                          Number(onChainAmountUSD) || 0,
                          false
                        )
                      )
                    }
                    className="flex-1 rounded-lg bg-[#141518] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#059669] disabled:opacity-45"
                  >
                    {activeEvmWallet
                      ? lang === 'ar'
                        ? 'طلب توقيع التحويل'
                        : 'Request Wallet Signature'
                      : lang === 'ar'
                      ? 'اربط محفظة EVM أولاً'
                      : 'Connect EVM Wallet First'}
                  </button>
                </div>
              </div>

              {/* Verify Real Tx Hash */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  runAction(() =>
                    onVerifyTxDeposit(
                      depositHash.trim(),
                      depositCurrency,
                      Number(depositAmount) || 0,
                      depositChainHex
                    )
                  );
                }}
                className="space-y-3 border-t border-[#F3F4F6] pt-4"
              >
                <div className="text-xs font-bold text-[#141518]">
                  {lang === 'ar'
                    ? '2) توثيق معرف معاملة على البلوكشين (Tx Hash)'
                    : '2) Verify Real On-Chain Transaction Hash'}
                </div>
                <input
                  type="text"
                  required
                  dir="ltr"
                  value={depositHash}
                  onChange={(e) => setDepositHash(e.target.value)}
                  placeholder="0x... (64 hex chars)"
                  className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 font-mono-data text-xs"
                />
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={depositCurrency}
                    onChange={(e) => setDepositCurrency(e.target.value as SupportedCurrency)}
                    className="rounded-lg border border-[#D1D5DB] bg-white px-2 py-2 text-xs"
                  >
                    <option value="USDT">USDT</option>
                    <option value="USDC">USDC</option>
                    <option value="ETH">ETH</option>
                  </select>
                  <select
                    value={depositChainHex}
                    onChange={(e) => setDepositChainHex(e.target.value)}
                    className="rounded-lg border border-[#D1D5DB] bg-white px-2 py-2 text-xs"
                  >
                    <option value="0x1">Ethereum</option>
                    <option value="0x89">Polygon</option>
                    <option value="0x2105">Base</option>
                    <option value="0xa4b1">Arbitrum</option>
                  </select>
                  <input
                    type="number"
                    min="0.0001"
                    step="any"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="rounded-lg border border-[#D1D5DB] px-2.5 py-2 font-mono-data text-xs"
                  />
                </div>
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-lg bg-[#059669] py-2.5 text-xs font-semibold text-white hover:bg-[#047857] disabled:opacity-50"
                >
                  {lang === 'ar' ? 'التحقق من البلوكشين وإضافة الرصيد' : 'Verify On-Chain & Credit'}
                </button>
              </form>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                runAction(() =>
                  onWithdrawInternal(withdrawCurrency, Number(withdrawAmount) || 0, withdrawDest.trim())
                );
              }}
              className="mt-4 space-y-3"
            >
              <p className="text-xs text-[#6B7280]">
                {lang === 'ar'
                  ? 'يمكن سحب الأرصدة المتوفرة في الرصيد الداخلي الموثّق فقط.'
                  : 'Withdrawals validate strictly against your verified internal Store-21 balance.'}
              </p>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#141518]">
                  {lang === 'ar' ? 'العملة' : 'Asset'}
                </label>
                <select
                  value={withdrawCurrency}
                  onChange={(e) => setWithdrawCurrency(e.target.value as SupportedCurrency)}
                  className="w-full rounded-lg border border-[#D1D5DB] bg-white px-3 py-2 text-xs"
                >
                  {internalBalances.map((b) => (
                    <option key={b.currency} value={b.currency}>
                      {b.currency} ({lang === 'ar' ? 'المتاح:' : 'Available:'} {b.amount})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#141518]">
                  {lang === 'ar' ? 'المبلغ' : 'Amount'}
                </label>
                <input
                  type="number"
                  required
                  min="0.0001"
                  step="any"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 font-mono-data text-xs"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#141518]">
                  {lang === 'ar' ? 'عنوان المحفظة المستلمة' : 'Destination Address'}
                </label>
                <input
                  type="text"
                  required
                  dir="ltr"
                  value={withdrawDest}
                  onChange={(e) => setWithdrawDest(e.target.value)}
                  placeholder="0x... or Solana address"
                  className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 font-mono-data text-xs"
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-lg bg-[#141518] py-2.5 text-xs font-semibold text-white hover:bg-[#059669] disabled:opacity-50"
              >
                {lang === 'ar' ? 'إرسال طلب السحب' : 'Submit Withdrawal Request'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Transaction History & Payment History */}
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] pb-4">
          <div className="flex items-center gap-2">
            <WalletIcon className="h-4 w-4 text-[#059669]" />
            <h2 className="font-display text-base font-bold text-[#141518]">
              {lang === 'ar' ? 'سجل المعاملات والمدفوعات' : 'Transaction & Payment History'}
            </h2>
          </div>

          <div className="inline-flex rounded-lg border border-[#E5E7EB] bg-[#F8F9FA] p-1">
            <button
              type="button"
              onClick={() => setHistoryTab('transactions')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold ${
                historyTab === 'transactions' ? 'bg-white text-[#141518] shadow-xs' : 'text-[#6B7280]'
              }`}
            >
              <History className="h-3.5 w-3.5" />
              <span>{lang === 'ar' ? 'سجل المعاملات' : 'Transactions'}</span>
            </button>
            <button
              type="button"
              onClick={() => setHistoryTab('payments')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold ${
                historyTab === 'payments' ? 'bg-white text-[#141518] shadow-xs' : 'text-[#6B7280]'
              }`}
            >
              <Receipt className="h-3.5 w-3.5" />
              <span>{lang === 'ar' ? 'سجل المدفوعات' : 'Payment History'}</span>
            </button>
          </div>
        </div>

        {historyTab === 'transactions' ? (
          transactions.length === 0 ? (
            <div className="py-10 text-center text-xs text-[#6B7280]">
              {lang === 'ar'
                ? 'لا توجد معاملات موثّقة بعد. قم بتوثيق إيداع حقيقي أو إتمام دفع عبر محفظة متصلة.'
                : 'No verified transactions yet. Credit via an on-chain deposit or complete a connected wallet checkout.'}
            </div>
          ) : (
            <div className="divide-y divide-[#F3F4F6] text-xs">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <div className="font-bold text-[#141518]">
                      {tx.kind} · {tx.network}
                    </div>
                    <div className="font-mono-data text-[11px] text-[#6B7280]" dir="ltr">
                      {tx.reference}
                    </div>
                  </div>
                  <div className="text-end">
                    <div className="font-mono-data font-bold text-[#141518]">
                      {tx.amount} {tx.currency}
                    </div>
                    <div
                      className={`text-[11px] font-semibold ${
                        tx.status === 'verified_onchain'
                          ? 'text-[#059669]'
                          : tx.status === 'rejected'
                          ? 'text-[#DC2626]'
                          : 'text-[#B45309]'
                      }`}
                    >
                      {tx.status} · {tx.timestamp}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : orders.length === 0 ? (
          <div className="py-10 text-center text-xs text-[#6B7280]">
            {lang === 'ar' ? 'لا توجد مدفوعات طلبات مسجلة حتى الآن.' : 'No order payments recorded yet.'}
          </div>
        ) : (
          <div className="divide-y divide-[#F3F4F6] text-xs">
            {orders.map((ord) => (
              <div key={ord.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <div className="font-bold text-[#141518]">
                    {ord.referenceCode} · {ord.storeName}
                  </div>
                  <div className="text-[11px] text-[#6B7280]">
                    {ord.items.map((i) => `${lang === 'ar' ? i.title : i.titleEn} (×${i.quantity})`).join(', ')}
                  </div>
                </div>
                <div className="text-end">
                  <div className="font-mono-data font-bold text-[#059669]">
                    ${ord.totalUSD.toLocaleString()} {ord.currency}
                  </div>
                  <div className="flex items-center justify-end gap-1.5 text-[11px] text-[#6B7280]">
                    <span>{ord.status}</span>
                    {ord.txHash && ord.txHash.startsWith('0x') && (
                      <a
                        href={`https://etherscan.io/tx/${ord.txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-0.5 text-[#059669] hover:underline"
                      >
                        <span>Explorer</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
