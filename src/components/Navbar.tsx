import React, { useState } from 'react';
import {
  Bell,
  Globe,
  Home,
  MessageCircle,
  Radio,
  Search,
  ShoppingBag,
  User,
  X,
} from 'lucide-react';
import { UI_COPY } from '../i18n/translations';
import { Language, PrimarySection, UserProfile } from '../types/commerce';
import { Store21Mark } from './BrandIcons';

interface TopBarProps {
  lang: Language;
  onToggleLang: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  cartCount: number;
  unreadNotifications: number;
  profile: UserProfile;
  onOpenCart: () => void;
  onNavigate: (section: PrimarySection) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  lang,
  onToggleLang,
  searchQuery,
  onSearchChange,
  cartCount,
  unreadNotifications,
  profile,
  onOpenCart,
  onNavigate,
}) => {
  const t = UI_COPY[lang];
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-[#E5E7EB] bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-[1360px] items-center justify-between gap-2 px-3 sm:h-16 sm:gap-4 sm:px-6">
        {/* Brand Wordmark */}
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="flex shrink-0 items-center gap-2 text-start whitespace-nowrap"
        >
          <Store21Mark className="h-7 w-7 sm:h-8 sm:w-8" />
          <span className="font-display text-base font-extrabold tracking-tight text-[#141518] sm:text-lg">
            {t.brand}
          </span>
        </button>

        {/* Clean Global Search (Desktop & Tablet) */}
        <div className="hidden max-w-md flex-1 sm:block">
          <div className="relative">
            <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t.nav.searchPlaceholder}
              className="w-full rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] py-2 ps-10 pe-9 text-xs text-[#141518] placeholder-[#6B7280] outline-none transition-colors focus:border-[#059669] focus:bg-white"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label={t.common.close}
                className="absolute end-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-[#6B7280] hover:text-[#141518]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Utility Actions: Mobile Search Toggle, Language, Cart, Notifications, Profile */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setMobileSearchOpen((p) => !p)}
            aria-label={t.common.search}
            aria-expanded={mobileSearchOpen}
            className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-colors sm:hidden ${
              mobileSearchOpen || searchQuery
                ? 'border-[#059669] bg-[#ECFDF5] text-[#059669]'
                : 'border-[#E5E7EB] text-[#141518]'
            }`}
          >
            {mobileSearchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={onToggleLang}
            className="inline-flex h-10 items-center gap-1 rounded-lg border border-[#E5E7EB] px-2.5 text-xs font-semibold text-[#141518] transition-colors hover:border-[#059669] whitespace-nowrap sm:h-9"
            aria-label="Toggle language"
          >
            <Globe className="h-3.5 w-3.5 text-[#059669]" />
            <span>{lang === 'ar' ? 'EN' : 'AR'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenCart}
            aria-label={t.nav.cart}
            className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-[#E5E7EB] text-[#141518] transition-colors hover:border-[#059669] sm:h-9 sm:w-9"
          >
            <ShoppingBag className="h-4 w-4" />
            {cartCount > 0 && (
              <span className="absolute -end-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#059669] px-1 font-mono-data text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setNotifOpen((p) => !p)}
              aria-label="Notifications"
              className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-[#E5E7EB] text-[#141518] transition-colors hover:border-[#059669] sm:h-9 sm:w-9"
            >
              <Bell className="h-4 w-4" />
              {unreadNotifications > 0 && (
                <span className="absolute -end-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#DC2626] px-1 font-mono-data text-[10px] font-bold text-white">
                  {unreadNotifications}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute end-0 z-50 mt-2 w-72 rounded-xl border border-[#E5E7EB] bg-white p-3 shadow-xl">
                <div className="mb-2 border-b border-[#F3F4F6] pb-2 text-xs font-bold text-[#141518]">
                  {lang === 'ar' ? 'التنبيهات الأخيرة' : 'Notifications'}
                </div>
                <div className="space-y-1.5 text-xs text-[#4B5563]">
                  <button
                    type="button"
                    onClick={() => {
                      setNotifOpen(false);
                      onNavigate('chats');
                    }}
                    className="block w-full rounded-lg p-2 text-start hover:bg-[#F8F9FA]"
                  >
                    {lang === 'ar'
                      ? 'رسائل ومناقشات جديدة في المحادثات'
                      : 'Unread private & group messages in Chats'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNotifOpen(false);
                      onNavigate('channels');
                    }}
                    className="block w-full rounded-lg p-2 text-start hover:bg-[#F8F9FA]"
                  >
                    {lang === 'ar'
                      ? 'تحديثات وبث مباشر في القنوات'
                      : 'New releases and live broadcasts in Channels'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => onNavigate('profile')}
            aria-label={t.nav.profile}
            className="flex h-10 items-center gap-2 rounded-full border border-[#E5E7EB] p-0.5 transition-colors hover:border-[#059669] sm:h-9 lg:pe-2.5"
          >
            <img
              src={profile.avatar}
              alt={profile.name}
              referrerPolicy="no-referrer"
              className="h-8 w-8 rounded-full object-cover sm:h-7 sm:w-7"
            />
            <span className="hidden max-w-[96px] truncate text-xs font-semibold text-[#141518] lg:inline">
              {profile.name}
            </span>
          </button>
        </div>
      </div>

      {/* Collapsible Mobile Search Input */}
      {mobileSearchOpen && (
        <div className="border-t border-[#F3F4F6] bg-white px-3 py-2 sm:hidden">
          <div className="relative">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6B7280]" />
            <input
              type="search"
              autoFocus
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t.nav.searchPlaceholder}
              className="w-full rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] py-2 ps-9 pe-9 text-xs text-[#141518] outline-none focus:border-[#059669] focus:bg-white"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label={t.common.close}
                className="absolute end-2.5 top-1/2 -translate-y-1/2 text-[#6B7280]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

// Strictly four core navigation items
const PRIMARY_NAV_ITEMS: {
  id: PrimarySection;
  Icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'home', Icon: Home },
  { id: 'chats', Icon: MessageCircle },
  { id: 'channels', Icon: Radio },
  { id: 'profile', Icon: User },
];

export const DesktopSidebar: React.FC<{
  lang: Language;
  activeSection: PrimarySection;
  unreadChats: number;
  liveChannelsCount: number;
  onNavigate: (section: PrimarySection) => void;
}> = ({ lang, activeSection, unreadChats, liveChannelsCount, onNavigate }) => {
  const t = UI_COPY[lang];

  return (
    <aside className="hidden w-56 shrink-0 md:block">
      <nav
        aria-label="Primary Navigation"
        className="sticky top-22 rounded-2xl border border-[#E5E7EB] bg-white p-2.5"
      >
        <div className="space-y-1">
          {PRIMARY_NAV_ITEMS.map(({ id, Icon }) => {
            const active = activeSection === id;
            const badgeCount =
              id === 'chats' ? unreadChats : id === 'channels' ? liveChannelsCount : 0;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onNavigate(id)}
                className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-[#ECFDF5] text-[#059669]'
                    : 'text-[#4B5563] hover:bg-[#F8F9FA] hover:text-[#141518]'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{t.nav[id]}</span>
                </span>
                {badgeCount > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 font-mono-data text-[10px] font-bold text-white ${
                      id === 'channels' ? 'bg-[#DC2626]' : 'bg-[#059669]'
                    }`}
                  >
                    {badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </aside>
  );
};

export const MobileBottomNav: React.FC<{
  lang: Language;
  activeSection: PrimarySection;
  unreadChats: number;
  liveChannelsCount: number;
  onNavigate: (section: PrimarySection) => void;
}> = ({ lang, activeSection, unreadChats, liveChannelsCount, onNavigate }) => {
  const t = UI_COPY[lang];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-[#E5E7EB] bg-white/95 backdrop-blur-sm md:hidden"
    >
      <div className="grid h-14 grid-cols-4">
        {PRIMARY_NAV_ITEMS.map(({ id, Icon }) => {
          const active = activeSection === id;
          const badgeCount =
            id === 'chats' ? unreadChats : id === 'channels' ? liveChannelsCount : 0;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              className={`relative flex min-h-[48px] flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors ${
                active ? 'text-[#059669]' : 'text-[#6B7280]'
              }`}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {badgeCount > 0 && (
                  <span
                    className={`absolute -end-2 -top-1 flex h-4 min-w-[14px] items-center justify-center rounded-full px-1 font-mono-data text-[9px] font-bold text-white ${
                      id === 'channels' ? 'bg-[#DC2626]' : 'bg-[#059669]'
                    }`}
                  >
                    {badgeCount}
                  </span>
                )}
              </div>
              <span className="truncate">{t.nav[id]}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
