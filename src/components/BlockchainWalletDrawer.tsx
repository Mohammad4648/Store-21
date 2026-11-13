import React, { useState } from 'react';
import {
  CheckCircle2,
  ExternalLink,
  Minus,
  Plus,
  ShieldCheck,
  Trash2,
  Wallet,
  X,
} from 'lucide-react';
import { CRYPTO_RATES_USD, FINISH_LABELS, NETWORK_CONFIG } from '../data/initialData';
import {
  BlockchainNetwork,
  CartItem,
  CryptoCurrency,
  OnChainOrder,
  WalletState,
} from '../types/commerce';
import { NetworkLogo, TokenLogo } from './BrandIcons';

interface BlockchainWalletDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: WalletState;
  onConnectRealWallet: () => Promise<void>;
  onConnectDemoWallet: () => void;
  onDisconnectWallet: () => void;
  onChangeNetwork: (network: BlockchainNetwork) => void;
  cart: CartItem[];
  onUpdateQty: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckoutSuccess: (
    currency: CryptoCurrency,
    amountCrypto: number,
    amountUSDC: number,
    txHash: string,
    blockNumber: number
  ) => void;
  orders: OnChainOrder[];
  activeDiscountPercent: number;
}

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
  }
}

function generateTxHash(): string {
  const chars = '0123456789abcdef';
  let hash = '0x';
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

export const BlockchainWalletDrawer: React.FC<BlockchainWalletDrawerProps> = ({
  isOpen,
  onClose,
  wallet,
  onConnectRealWallet,
  onConnectDemoWallet,
  onDisconnectWallet,
  onChangeNetwork,
  cart,
  onUpdateQty,
  onRemoveItem,
  onCheckoutSuccess,
  orders,
  activeDiscountPercent,
}) => {
  const [tab, setTab] = useState<'checkout' | 'ledger'>('checkout');
  const [selectedCurrency, setSelectedCurrency] = useState<CryptoCurrency>('USDC');
  const [txStage, setTxStage] = useState<'idle' | 'signing' | 'confirming' | 'confirmed'>('idle');
  const [lastTxHash, setLastTxHash] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const rawSubtotalUSDC = cart.reduce(
    (sum, item) => sum + item.product.priceUSDC * item.quantity,
    0
  );
  const discountUSDC = Math.round(rawSubtotalUSDC * (activeDiscountPercent / 100));
  const netSubtotalUSDC = Math.max(0, rawSubtotalUSDC - discountUSDC);
  const networkMeta = NETWORK_CONFIG[wallet.network];
  const totalUSD = netSubtotalUSDC + (cart.length > 0 ? networkMeta.gasUsd : 0);
  const rate = CRYPTO_RATES_USD[selectedCurrency];
  const totalCrypto = totalUSD / rate;

  const handlePayOnChain = async () => {
    setErrorMsg('');
    if (!wallet.connected) {
      setErrorMsg('يرجى ربط محفظة البلوك تشين أولاً لإتمام التوقيع.');
      return;
    }
    if (cart.length === 0) return;
    if (wallet.balances[selectedCurrency] < totalCrypto) {
      setErrorMsg(
        `الرصيد غير كافٍ بعملة ${selectedCurrency}. يمكنك التبديل إلى عملة أخرى أو استخدام رصيد USDC.`
      );
      return;
    }

    setTxStage('signing');
    await new Promise((res) => setTimeout(res, 700));
    setTxStage('confirming');
    await new Promise((res) => setTimeout(res, networkMeta.confirmSeconds * 450));

    const txHash = generateTxHash();
    const blockNum = 61482000 + Math.floor(Math.random() * 9500);
    setLastTxHash(txHash);
    setTxStage('confirmed');
    onCheckoutSuccess(selectedCurrency, totalCrypto, netSubtotalUSDC, txHash, blockNum);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-label="محفظة البلوكتشين والدفع الذكي"
    >
      <div className="flex h-full w-full max-w-lg flex-col border-s border-[#E1E3E5] bg-white text-[#202223] shadow-2xl">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-[#E1E3E5] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <Wallet className="h-5 w-5 text-[#008060]" />
            <h2 className="font-display text-lg font-bold text-[#202223]">
              محفظة البلوكتشين والدفع
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق النافذة"
            className="rounded-lg p-1.5 text-[#6D7175] hover:bg-[#F6F6F7] hover:text-[#202223]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Segmented Tabs */}
        <div className="border-b border-[#E1E3E5] bg-[#FAFBFB] px-6 py-3">
          <div className="grid grid-cols-2 gap-1 rounded-xl border border-[#E1E3E5] bg-[#F1F2F4] p-1">
            <button
              type="button"
              onClick={() => {
                setTab('checkout');
                setTxStage('idle');
              }}
              className={`rounded-lg py-1.5 text-xs font-bold transition-colors ${
                tab === 'checkout'
                  ? 'bg-white text-[#202223] shadow-xs'
                  : 'text-[#6D7175] hover:text-[#202223]'
              }`}
            >
              الدفع وسلة المشتريات ({cart.length})
            </button>
            <button
              type="button"
              onClick={() => setTab('ledger')}
              className={`rounded-lg py-1.5 text-xs font-bold transition-colors ${
                tab === 'ledger'
                  ? 'bg-white text-[#202223] shadow-xs'
                  : 'text-[#6D7175] hover:text-[#202223]'
              }`}
            >
              سجل المعاملات ({orders.length})
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          {/* Wallet Connection Card */}
          <div className="rounded-2xl border border-[#E1E3E5] bg-[#FAFBFB] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs text-[#6D7175]">حالة المحفظة الرقمية</div>
                <div className="mt-1 font-mono-data text-sm font-bold text-[#202223]">
                  {wallet.connected ? wallet.address : 'غير متصلة'}
                </div>
              </div>
              {wallet.connected && (
                <button
                  type="button"
                  onClick={onDisconnectWallet}
                  className="text-xs font-semibold text-[#D72C0D] hover:underline"
                >
                  فصل
                </button>
              )}
            </div>

            {!wallet.connected ? (
              <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={onConnectDemoWallet}
                  className="rounded-xl bg-[#008060] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#006E52]"
                >
                  ربط محفظة تجريبية فورية
                </button>
                <button
                  type="button"
                  onClick={onConnectRealWallet}
                  className="rounded-xl border border-[#C9CCCF] bg-white px-3.5 py-2 text-xs font-semibold text-[#202223] hover:bg-[#F6F6F7]"
                >
                  MetaMask / Web3 Provider
                </button>
              </div>
            ) : (
              <div className="mt-4 space-y-3 border-t border-[#E1E3E5] pt-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs text-[#6D7175]">
                    <NetworkLogo network={wallet.network} className="h-4 w-4" />
                    <span>الشبكة النشطة:</span>
                  </span>
                  <select
                    value={wallet.network}
                    onChange={(e) => onChangeNetwork(e.target.value as BlockchainNetwork)}
                    className="rounded-lg border border-[#C9CCCF] bg-white px-2.5 py-1 text-xs text-[#202223] outline-none focus:border-[#008060]"
                  >
                    {(Object.keys(NETWORK_CONFIG) as BlockchainNetwork[]).map((net) => (
                      <option key={net} value={net}>
                        {NETWORK_CONFIG[net].name} (رسوم ~${NETWORK_CONFIG[net].gasUsd})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center">
                  {(Object.keys(wallet.balances) as CryptoCurrency[]).map((cur) => (
                    <div
                      key={cur}
                      className="rounded-xl border border-[#E1E3E5] bg-white p-2"
                    >
                      <div className="flex items-center justify-center gap-1 text-[11px] text-[#6D7175]">
                        <TokenLogo currency={cur} className="h-3.5 w-3.5" />
                        <span>{cur}</span>
                      </div>
                      <div className="mt-1 font-mono-data text-xs font-bold text-[#202223]">
                        {wallet.balances[cur].toFixed(cur === 'ETH' || cur === 'SOL' ? 2 : 0)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {tab === 'checkout' ? (
            <>
              {txStage === 'confirmed' && (
                <div className="rounded-2xl border border-[#C7E6DC] bg-[#EBF5F2] p-5">
                  <div className="flex items-center gap-2 text-[#008060]">
                    <CheckCircle2 className="h-5 w-5" />
                    <h3 className="font-display text-base font-bold">
                      تمت التسوية وتوثيق الطلب على البلوك تشين!
                    </h3>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-[#202223]">
                    تم حجز المبلغ في العقد الذكي للضمان وسيُحول للمتجر فور تأكيد استلام الشحنة.
                  </p>
                  <div className="mt-3 rounded-lg border border-[#C7E6DC] bg-white p-3 font-mono-data text-[11px] text-[#006E52] break-all">
                    TX: {lastTxHash}
                  </div>
                  <button
                    type="button"
                    onClick={() => setTab('ledger')}
                    className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#008060] underline"
                  >
                    <span>عرض في سجل المعاملات</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {cart.length === 0 && txStage !== 'confirmed' ? (
                <div className="rounded-2xl border border-[#E1E3E5] bg-[#FAFBFB] p-8 text-center">
                  <p className="text-sm text-[#6D7175]">
                    سلة المشتريات فارغة حالياً. أضف منتجات من المعرض ثلاثي الأبعاد أو القناة أو البث.
                  </p>
                </div>
              ) : (
                cart.length > 0 && (
                  <div className="space-y-4">
                    {/* Cart Items */}
                    <div className="space-y-3">
                      {cart.map((item) => (
                        <div
                          key={`${item.product.id}-${item.selectedFinish}`}
                          className="flex items-center justify-between gap-3 rounded-2xl border border-[#E1E3E5] bg-white p-3.5"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={item.product.image}
                              alt={item.product.title}
                              referrerPolicy="no-referrer"
                              className="h-14 w-16 shrink-0 rounded-lg object-cover bg-[#F6F6F7]"
                            />
                            <div className="min-w-0">
                              <div className="truncate text-xs font-bold text-[#202223]">
                                {item.product.title}
                              </div>
                              <div className="mt-0.5 text-[11px] text-[#6D7175]">
                                {FINISH_LABELS[item.selectedFinish].label} ·{' '}
                                <span className="font-mono-data font-bold text-[#008060]">
                                  {item.product.priceUSDC.toLocaleString()} USDC
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => onUpdateQty(item.product.id, -1)}
                              className="rounded-md border border-[#C9CCCF] p-1 text-[#202223] hover:bg-[#F6F6F7]"
                              aria-label="إنقاص الكمية"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-5 text-center font-mono-data text-xs font-bold">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => onUpdateQty(item.product.id, 1)}
                              className="rounded-md border border-[#C9CCCF] p-1 text-[#202223] hover:bg-[#F6F6F7]"
                              aria-label="زيادة الكمية"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onRemoveItem(item.product.id)}
                              className="ms-1 text-[#8C9196] hover:text-[#D72C0D]"
                              aria-label="حذف المنتج"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Token Currency Selector */}
                    <div className="rounded-2xl border border-[#E1E3E5] bg-[#FAFBFB] p-4">
                      <div className="mb-2.5 text-xs font-bold text-[#202223]">
                        اختر عملة الدفع عبر البلوك تشين
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {(['USDC', 'USDT', 'ETH', 'SOL'] as CryptoCurrency[]).map((cur) => (
                          <button
                            key={cur}
                            type="button"
                            onClick={() => setSelectedCurrency(cur)}
                            className={`inline-flex items-center justify-center gap-1.5 rounded-xl border py-2 font-mono-data text-xs font-bold transition-colors ${
                              selectedCurrency === cur
                                ? 'border-[#008060] bg-[#EBF5F2] text-[#008060]'
                                : 'border-[#E1E3E5] bg-white text-[#6D7175] hover:text-[#202223]'
                            }`}
                          >
                            <TokenLogo currency={cur} className="h-4 w-4" />
                            <span>{cur}</span>
                          </button>
                        ))}
                      </div>

                      <div className="mt-4 space-y-2 border-t border-[#E1E3E5] pt-3 text-xs">
                        <div className="flex justify-between text-[#6D7175]">
                          <span>قيمة المنتجات:</span>
                          <span className="font-mono-data font-semibold text-[#202223]">
                            {rawSubtotalUSDC.toLocaleString()} USDC
                          </span>
                        </div>
                        {discountUSDC > 0 && (
                          <div className="flex justify-between font-semibold text-[#008060]">
                            <span>خصم البث المباشر ({activeDiscountPercent}%):</span>
                            <span className="font-mono-data">-{discountUSDC.toLocaleString()} USDC</span>
                          </div>
                        )}
                        <div className="flex justify-between text-[#6D7175]">
                          <span>رسوم شبكة {networkMeta.name}:</span>
                          <span className="font-mono-data font-semibold text-[#202223]">
                            ~${networkMeta.gasUsd}
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-[#E1E3E5] pt-2 text-sm font-bold text-[#202223]">
                          <span>الإجمالي المطلوب توقيعه:</span>
                          <span className="font-mono-data text-[#008060]">
                            {totalCrypto.toFixed(
                              selectedCurrency === 'ETH' || selectedCurrency === 'SOL' ? 4 : 2
                            )}{' '}
                            {selectedCurrency}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 flex items-start gap-2 rounded-xl border border-[#E1E3E5] bg-white p-2.5 text-[11px] text-[#6D7175]">
                        <ShieldCheck className="h-4 w-4 shrink-0 text-[#008060]" />
                        <span>
                          نظام الضمان الذكي (Escrow): تبقى أموالك مؤمنة في العقد الذكي ولا تُحول
                          للبائع إلا بعد شحن المنتج وتأكيد الاستلام.
                        </span>
                      </div>

                      {errorMsg && <p className="mt-3 text-xs font-medium text-[#D72C0D]">{errorMsg}</p>}

                      <button
                        type="button"
                        disabled={txStage === 'signing' || txStage === 'confirming'}
                        onClick={handlePayOnChain}
                        className="mt-4 w-full rounded-xl bg-[#008060] py-3 text-xs font-bold text-white transition-colors hover:bg-[#006E52] disabled:opacity-60"
                      >
                        {txStage === 'signing'
                          ? 'جاري طلب توقيع المحفظة...'
                          : txStage === 'confirming'
                          ? `جاري تأكيد الكتلة على ${networkMeta.name}...`
                          : `تأكيد والدفع (${totalCrypto.toFixed(
                              selectedCurrency === 'ETH' || selectedCurrency === 'SOL' ? 4 : 2
                            )} ${selectedCurrency})`}
                      </button>
                    </div>
                  </div>
                )
              )}
            </>
          ) : (
            <div className="space-y-3">
              {orders.length === 0 ? (
                <div className="rounded-2xl border border-[#E1E3E5] bg-[#FAFBFB] p-8 text-center text-sm text-[#6D7175]">
                  لا توجد معاملات مسجلة بعد. أتمم أول عملية شراء لعرض إثبات البلوك تشين هنا.
                </div>
              ) : (
                orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="rounded-2xl border border-[#E1E3E5] bg-[#FAFBFB] p-4 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-[#202223]">{ord.channelName}</span>
                      <span className="font-semibold text-[#008060]">{ord.escrowStatus}</span>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[#6D7175]">
                      <span>
                        {NETWORK_CONFIG[ord.network].name} · Block #{ord.blockNumber}
                      </span>
                      <span className="font-mono-data font-bold text-[#008060]">
                        {ord.amountCrypto.toFixed(
                          ord.currency === 'ETH' || ord.currency === 'SOL' ? 4 : 2
                        )}{' '}
                        {ord.currency}
                      </span>
                    </div>
                    <div className="mt-2 truncate font-mono-data text-[11px] text-[#8C9196]" dir="ltr">
                      {ord.txHash}
                    </div>
                    <div className="mt-2 border-t border-[#E1E3E5] pt-2 text-[11px] text-[#202223]">
                      {ord.items.map((it, idx) => (
                        <div key={idx}>
                          {it.title} × {it.quantity}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
