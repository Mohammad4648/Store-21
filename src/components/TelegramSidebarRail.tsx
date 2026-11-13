import React from 'react';
import { Box, Clapperboard, Link2, Send, ShoppingBag, Wallet } from 'lucide-react';
import { ActiveSection } from '../types/commerce';

interface TelegramSidebarRailProps {
  activeView: ActiveSection;
  onSelectView: (view: ActiveSection) => void;
  totalUnread: number;
  liveCount: number;
  onOpenWallet: () => void;
}

export const TelegramSidebarRail: React.FC<TelegramSidebarRailProps> = ({
  activeView,
  onSelectView,
  totalUnread,
  liveCount,
  onOpenWallet,
}) => {
  const items: {
    id: ActiveSection;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }[] = [
    { id: 'showcase', label: '3D العرض', icon: Box },
    { id: 'channels', label: 'القنوات', icon: Send, badge: totalUnread },
    { id: 'live', label: 'تيك توك', icon: Clapperboard, badge: liveCount },
    { id: 'products', label: 'المنتجات', icon: ShoppingBag },
    { id: 'integrations', label: 'الربط', icon: Link2 },
  ];

  return (
    <>
      {/* Desktop Telegram-Style Vertical Shortcut Rail (Right Edge in RTL) */}
      <aside
        aria-label="اختصارات المنصة"
        className="hidden w-[78px] shrink-0 flex-col items-center justify-between border-e border-[#2C2E33] bg-[#18181B] py-4 md:flex"
      >
        <div className="flex w-full flex-col items-center gap-2 px-1.5">
          {items.map((item) => {
            const Icon = item.icon;
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectView(item.id)}
                className={`relative flex w-full flex-col items-center gap-1 rounded-xl px-1 py-2.5 text-[11px] font-medium transition-colors ${
                  active
                    ? 'bg-[#008060] text-white'
                    : 'text-[#A1A1AA] hover:bg-[#27272A] hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="truncate max-w-full">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`absolute top-1.5 left-2 rounded-md px-1 font-mono-data text-[10px] font-bold ${
                      active ? 'bg-white text-[#008060]' : 'bg-[#008060] text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex w-full flex-col items-center gap-2 border-t border-[#2C2E33] px-1.5 pt-3">
          <button
            type="button"
            onClick={onOpenWallet}
            className="flex w-full flex-col items-center gap-1 rounded-xl px-1 py-2.5 text-[11px] font-medium text-[#A1A1AA] transition-colors hover:bg-[#27272A] hover:text-white"
          >
            <Wallet className="h-5 w-5 text-[#E5B84B]" />
            <span>المحفظة</span>
          </button>
        </div>
      </aside>

      {/* Mobile Compact Horizontal Shortcut Strip */}
      <nav
        aria-label="اختصارات الجوال"
        className="flex items-center justify-around border-b border-[#E1E3E5] bg-white px-2 py-2 md:hidden"
      >
        {items.map((item) => {
          const Icon = item.icon;
          const active = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectView(item.id)}
              className={`flex flex-col items-center gap-0.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold ${
                active ? 'bg-[#EBF5F2] text-[#008060]' : 'text-[#6D7175]'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
