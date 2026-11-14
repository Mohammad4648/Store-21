import React from 'react';
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { FINISH_LABELS } from '../data/initialData';
import { UI_COPY } from '../i18n/translations';
import { CartItem, Language } from '../types/commerce';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  cart: CartItem[];
  onUpdateQty: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onProceedToWallet: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  lang,
  cart,
  onUpdateQty,
  onRemoveItem,
  onProceedToWallet,
}) => {
  if (!isOpen) return null;

  const t = UI_COPY[lang];
  const subtotal = cart.reduce((sum, item) => sum + item.product.priceUSD * item.quantity, 0);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/45"
      role="dialog"
      aria-modal="true"
      aria-label={t.nav.cart}
    >
      <div className="flex h-full w-full max-w-md flex-col border-s border-[#E5E7EB] bg-white text-[#141518] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] px-6 py-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-[#059669]" />
            <h2 className="font-display text-base font-bold">
              {t.nav.cart} ({cart.reduce((s, c) => s + c.quantity, 0)})
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.common.close}
            className="rounded-lg p-1.5 text-[#6B7280] hover:bg-[#F3F4F6]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {cart.length === 0 ? (
            <div className="py-16 text-center text-sm text-[#6B7280]">
              {lang === 'ar'
                ? 'سلة المشتريات فارغة حالياً.'
                : 'Your shopping bag is currently empty.'}
            </div>
          ) : (
            <div className="divide-y divide-[#F3F4F6]">
              {cart.map((item) => (
                <div
                  key={`${item.product.id}-${item.selectedFinish}`}
                  className="flex items-center justify-between gap-3 py-4 first:pt-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={item.product.image}
                      alt={lang === 'ar' ? item.product.title : item.product.titleEn}
                      referrerPolicy="no-referrer"
                      className="h-14 w-16 shrink-0 rounded-lg object-cover bg-[#F3F4F6]"
                    />
                    <div className="min-w-0">
                      <div className="truncate text-xs font-bold text-[#141518]">
                        {lang === 'ar' ? item.product.title : item.product.titleEn}
                      </div>
                      <div className="mt-0.5 text-[11px] text-[#6B7280]">
                        {lang === 'ar'
                          ? FINISH_LABELS[item.selectedFinish].label
                          : FINISH_LABELS[item.selectedFinish].labelEn}{' '}
                        ·{' '}
                        <span className="font-mono-data font-semibold text-[#141518]">
                          ${item.product.priceUSD.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onUpdateQty(item.product.id, -1)}
                      aria-label="Decrease"
                      className="rounded border border-[#D1D5DB] p-1 text-[#4B5563]"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-6 text-center font-mono-data text-xs font-semibold">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => onUpdateQty(item.product.id, 1)}
                      aria-label="Increase"
                      className="rounded border border-[#D1D5DB] p-1 text-[#4B5563]"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.product.id)}
                      aria-label="Remove"
                      className="ms-1 text-[#9CA3AF] hover:text-[#DC2626]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-t border-[#E5E7EB] bg-[#F8F9FA] p-6">
            <div className="flex items-center justify-between text-sm font-bold text-[#141518]">
              <span>{lang === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</span>
              <span className="font-mono-data">${subtotal.toLocaleString()}</span>
            </div>
            <p className="mt-1.5 text-[11px] text-[#6B7280]">
              {lang === 'ar'
                ? 'يمكن إتمام الطلب عبر المحفظة المتصلة أو تسجيل طلب مباشر في قسم المحفظة.'
                : 'Complete payment via a connected Web3 wallet or record an order intent in Wallet.'}
            </p>
            <button
              type="button"
              onClick={() => {
                onClose();
                onProceedToWallet();
              }}
              className="mt-4 w-full rounded-lg bg-[#059669] py-3 text-xs font-semibold text-white hover:bg-[#047857]"
            >
              {lang === 'ar' ? 'المتابعة إلى صفحة المحفظة والدفع' : 'Proceed to Wallet & Checkout'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
