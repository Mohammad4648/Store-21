import React from 'react';
import { Search, Wallet } from 'lucide-react';
import { ActiveSection, WalletState } from '../types/commerce';
import { SouqChainMark } from './BrandIcons';

interface TopNavProps {
  activeView: ActiveSection;
  onSelectView: (view: ActiveSection) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  wallet: WalletState;
  cartCount: number;
  onOpenWalletDrawer: () => void;
}

function formatShortAddress(addr: string): string {
  if (addr.length < 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export const TopNav: React.FC<TopNavProps> = ({
  onSelectView,
  searchQuery,
  onSearchChange,
  wallet,
  cartCount,
  onOpenWalletDrawer,
}) => {
  return (
    <header className="sticky top-0 z-40 h-14 border-b border-[#2C2E33] bg-[#1A1A1A] text-white">
      <div className="flex h-full items-center justify-between gap-8 px-4 sm:px-6">
        {/* Zone 1: Brand Wordmark */}
        <button
          type="button"
          onClick={() => onSelectView('showcase')}
          className="inline-flex items-center gap-2.5 font-display text-lg font-extrabold tracking-tight text-white whitespace-nowrap shrink-0"
        >
          <SouqChainMark className="h-6 w-6 shrink-0" />
          <span>سوق تشين</span>
        </button>

        {/* Zone 2: Clean Shopify-style Global Search */}
        <div className="hidden max-w-md flex-1 md:block">
          <div className="relative flex items-center">
            <Search className="pointer-events-none absolute right-3 h-4 w-4 text-[#8C9196]" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => {
                onSearchChange(e.target.value);
                if (e.target.value.trim()) {
                  onSelectView('products');
                }
              }}
              placeholder="ابحث عن منتج، قناة متجر، أو عقد..."
              className="w-full rounded-lg border border-[#3B3E45] bg-[#2C2E33] py-1.5 pr-9 pl-3 text-xs text-white placeholder-[#8C9196] outline-none transition-colors focus:border-[#008060] focus:bg-[#24262A]"
            />
          </div>
        </div>

        {/* Zone 3: Single Primary Wallet & Cart Action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onOpenWalletDrawer}
            className="inline-flex items-center gap-2 rounded-lg bg-[#008060] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#006E52] whitespace-nowrap shrink-0"
          >
            <Wallet className="h-4 w-4 shrink-0" />
            <span>
              {wallet.connected ? formatShortAddress(wallet.address) : 'ربط المحفظة'}
              {cartCount > 0 ? ` (${cartCount})` : ''}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
