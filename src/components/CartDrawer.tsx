import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { FINISH_LABELS } from '../data/initialData';
import { UI_COPY } from '../i18n/translations';
import { CartItem, Language } from '../types/commerce';
import {
  getCartItemKey,
  getCartSelectionState,
  pruneSelectedCartKeys,
  toggleCartItemSelection,
  toggleSelectAllCartItems,
} from '../utils/commerceLogic';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  cart: CartItem[];
  onUpdateQty: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onRemoveSelectedItems: (selectedKeys: string[]) => void;
  onProceedToWallet: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  lang,
  cart,
  onUpdateQty,
  onRemoveItem,
  onRemoveSelectedItems,
  onProceedToWallet,
}) => {
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const selectAllRef = useRef<HTMLInputElement | null>(null);

  const prunedSelectedKeys = useMemo(
    () => pruneSelectedCartKeys(cart, selectedKeys),
    [cart, selectedKeys]
  );

  const selection = useMemo(
    () => getCartSelectionState(cart, prunedSelectedKeys),
    [cart, prunedSelectedKeys]
  );

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = selection.someSelected;
    }
  }, [selection.someSelected, selection.allSelected, isOpen]);

  if (!isOpen) return null;

  const t = UI_COPY[lang];
  const subtotal = cart.reduce((sum, item) => sum + item.product.priceUSD * item.quantity, 0);

  const handleToggleSelectAll = () => {
    setSelectedKeys((prev) => toggleSelectAllCartItems(cart, prev));
  };

  const handleToggleItem = (key: string) => {
    setSelectedKeys((prev) => toggleCartItemSelection(pruneSelectedCartKeys(cart, prev), key));
  };

  const handleRemoveSelected = () => {
    if (prunedSelectedKeys.length === 0) return;
    onRemoveSelectedItems(prunedSelectedKeys);
    setSelectedKeys([]);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/45"
      role="dialog"
      aria-modal="true"
      aria-label={t.nav.cart}
    >
      <div className="flex h-full w-full max-w-md flex-col border-s border-[#E5E7EB] bg-white text-[#141518] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-[#059669]" />
            <h2 className="font-display text-base font-bold tabular-nums">
              {t.nav.cart} ({cart.reduce((s, c) => s + c.quantity, 0)})
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.common.close}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#6B7280] hover:bg-[#F3F4F6]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {cart.length > 0 && (
          <div className="flex items-center justify-between gap-3 border-b border-[#E5E7EB] bg-[#F8F9FA] px-5 py-2.5 sm:px-6">
            <label className="flex min-h-[36px] cursor-pointer select-none items-center gap-2.5 text-xs font-semibold text-[#141518]">
              <input
                ref={selectAllRef}
                type="checkbox"
                checked={selection.allSelected}
                onChange={handleToggleSelectAll}
                className="h-4 w-4 cursor-pointer rounded border-[#D1D5DB] accent-[#059669]"
              />
              <span className="whitespace-nowrap">
                {lang === 'ar' ? 'تحديد الكل' : 'Select All'}
              </span>
              <span className="font-mono-data text-[11px] font-medium text-[#6B7280] tabular-nums">
                {selection.selectedCount > 0
                  ? `${selection.selectedCount}/${selection.totalCount}`
                  : `(${selection.totalCount})`}
              </span>
            </label>

            <button
              type="button"
              onClick={handleRemoveSelected}
              disabled={selection.selectedCount === 0}
              className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                selection.selectedCount > 0
                  ? 'border-[#FECACA] bg-[#FEF2F2] text-[#DC2626] hover:bg-[#FEE2E2]'
                  : 'cursor-not-allowed border-[#E5E7EB] bg-white text-[#9CA3AF]'
              }`}
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>
                {lang === 'ar' ? 'حذف المحدد' : 'Remove Selected'}
                {selection.selectedCount > 0 ? ` (${selection.selectedCount})` : ''}
              </span>
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          {cart.length === 0 ? (
            <div className="py-16 text-center text-sm text-[#6B7280]">
              {lang === 'ar'
                ? 'سلة المشتريات فارغة حالياً.'
                : 'Your shopping bag is currently empty.'}
            </div>
          ) : (
            <div className="divide-y divide-[#F3F4F6]">
              {cart.map((item) => {
                const itemKey = getCartItemKey(item);
                const isSelected = prunedSelectedKeys.includes(itemKey);
                const title = lang === 'ar' ? item.product.title : item.product.titleEn;
                const finishLabel =
                  lang === 'ar'
                    ? FINISH_LABELS[item.selectedFinish].label
                    : FINISH_LABELS[item.selectedFinish].labelEn;

                return (
                  <div
                    key={`${item.product.id}-${item.selectedFinish}`}
                    className={`flex items-center justify-between gap-2.5 py-3.5 transition-colors ${
                      isSelected ? 'bg-[#ECFDF5]/40 -mx-2 px-2 rounded-xl' : ''
                    }`}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-2.5">
                      <label className="flex h-9 w-7 shrink-0 cursor-pointer items-center justify-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleItem(itemKey)}
                          aria-label={
                            lang === 'ar'
                              ? `تحديد ${title} (${finishLabel})`
                              : `Select ${title} (${finishLabel})`
                          }
                          className="h-4 w-4 cursor-pointer rounded border-[#D1D5DB] accent-[#059669]"
                        />
                      </label>
                      <img
                        src={item.product.image}
                        alt={title}
                        referrerPolicy="no-referrer"
                        className="h-14 w-14 shrink-0 rounded-lg bg-[#F3F4F6] object-cover sm:w-16"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-bold text-[#141518]">{title}</div>
                        <div className="mt-0.5 text-[11px] text-[#6B7280]">
                          {finishLabel} ·{' '}
                          <span className="font-mono-data font-semibold text-[#141518] tabular-nums">
                            ${item.product.priceUSD.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onUpdateQty(item.product.id, -1)}
                        aria-label={lang === 'ar' ? `إنقاص كمية ${title}` : `Decrease ${title} quantity`}
                        className="flex h-7 w-7 items-center justify-center rounded border border-[#D1D5DB] text-[#4B5563] hover:border-[#9CA3AF]"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center font-mono-data text-xs font-semibold tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateQty(item.product.id, 1)}
                        aria-label={lang === 'ar' ? `زيادة كمية ${title}` : `Increase ${title} quantity`}
                        className="flex h-7 w-7 items-center justify-center rounded border border-[#D1D5DB] text-[#4B5563] hover:border-[#9CA3AF]"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.product.id)}
                        aria-label={lang === 'ar' ? `حذف ${title}` : `Remove ${title}`}
                        className="ms-1 flex h-8 w-8 items-center justify-center rounded-lg text-[#9CA3AF] hover:bg-[#FEF2F2] hover:text-[#DC2626]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-t border-[#E5E7EB] bg-[#F8F9FA] px-5 py-4 sm:px-6 sm:py-5">
            <div className="flex items-center justify-between text-sm font-bold text-[#141518]">
              <span>{lang === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</span>
              <span className="font-mono-data tabular-nums">${subtotal.toLocaleString()}</span>
            </div>
            {selection.selectedCount > 0 && (
              <div className="mt-1 flex items-center justify-between text-[11px] text-[#059669] tabular-nums">
                <span>
                  {lang === 'ar'
                    ? `المحدد (${selection.selectedCount} من ${selection.totalCount})`
                    : `Selected (${selection.selectedCount} of ${selection.totalCount})`}
                </span>
                <span className="font-mono-data font-semibold">
                  ${selection.selectedSubtotalUSD.toLocaleString()}
                </span>
              </div>
            )}
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

