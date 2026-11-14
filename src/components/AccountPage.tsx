import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  Edit3,
  Globe,
  HelpCircle,
  Laptop,
  LogOut,
  Shield,
  User,
  X,
} from 'lucide-react';
import { UI_COPY } from '../i18n/translations';
import {
  ActiveSession,
  Language,
  SupportTicket,
  UserProfile,
} from '../types/commerce';

interface AccountPageProps {
  lang: Language;
  onChangeLang: (lang: Language) => void;
  profile: UserProfile;
  sessions: ActiveSession[];
  supportTickets: SupportTicket[];
  onSaveProfile: (next: UserProfile) => Promise<void>;
  onRevokeSession: (sessionId: string) => Promise<void>;
  onSubmitSupport: (subject: string, message: string) => Promise<void>;
  onLogout: () => void;
}

type AccountSectionKey =
  | 'info'
  | 'privacy'
  | 'notifications'
  | 'language'
  | 'devices'
  | 'support';

export const AccountPage: React.FC<AccountPageProps> = ({
  lang,
  onChangeLang,
  profile,
  sessions,
  supportTickets,
  onSaveProfile,
  onRevokeSession,
  onSubmitSupport,
  onLogout,
}) => {
  const t = UI_COPY[lang];
  const [activeSection, setActiveSection] = useState<AccountSectionKey>('info');
  const [editOpen, setEditOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  // Edit Profile form
  const [draftName, setDraftName] = useState(profile.name);
  const [draftUsername, setDraftUsername] = useState(profile.username);
  const [draftBio, setDraftBio] = useState(profile.bio);
  const [draftEmail, setDraftEmail] = useState(profile.email);
  const [draftPhone, setDraftPhone] = useState(profile.phone);

  // Support ticket form
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSent, setSupportSent] = useState(false);

  const openEditDialog = () => {
    setDraftName(profile.name);
    setDraftUsername(profile.username);
    setDraftBio(profile.bio);
    setDraftEmail(profile.email);
    setDraftPhone(profile.phone);
    setEditOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveProfile({
      ...profile,
      name: draftName.trim() || profile.name,
      username: draftUsername.trim() || profile.username,
      bio: draftBio.trim(),
      email: draftEmail.trim(),
      phone: draftPhone.trim(),
    });
    setEditOpen(false);
  };

  const togglePrivacy = (key: keyof UserProfile['privacy']) => {
    onSaveProfile({
      ...profile,
      privacy: { ...profile.privacy, [key]: !profile.privacy[key] },
    });
  };

  const toggleNotification = (key: keyof UserProfile['notifications']) => {
    onSaveProfile({
      ...profile,
      notifications: { ...profile.notifications, [key]: !profile.notifications[key] },
    });
  };

  const navItems: {
    id: AccountSectionKey;
    ar: string;
    en: string;
    Icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'info', ar: 'معلومات الحساب', en: 'Account Information', Icon: User },
    { id: 'privacy', ar: 'الأمان والخصوصية', en: 'Privacy & Security', Icon: Shield },
    { id: 'notifications', ar: 'تفضيلات الإشعارات', en: 'Notifications', Icon: Bell },
    { id: 'language', ar: 'اختيار اللغة', en: 'Language', Icon: Globe },
    { id: 'devices', ar: 'الأجهزة والجلسات', en: 'Devices & Sessions', Icon: Laptop },
    { id: 'support', ar: 'المساعدة والدعم', en: 'Help & Support', Icon: HelpCircle },
  ];

  return (
    <div className="space-y-6">
      {/* Clean Profile Banner Card */}
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={profile.avatar}
              alt={profile.name}
              referrerPolicy="no-referrer"
              className="h-16 w-16 rounded-full border-2 border-[#059669] object-cover"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-display text-xl font-extrabold text-[#141518]">{profile.name}</h1>
                {profile.verified && <CheckCircle2 className="h-4 w-4 text-[#059669]" />}
              </div>
              <div className="text-xs font-medium text-[#6B7280]" dir="ltr">
                {profile.username}
              </div>
              <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-[#4B5563]">
                {profile.bio}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openEditDialog}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#D1D5DB] bg-white px-3.5 py-2 text-xs font-semibold text-[#141518] hover:border-[#059669] hover:text-[#059669]"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>{lang === 'ar' ? 'تعديل الملف الشخصي' : 'Edit Profile'}</span>
            </button>
            <button
              type="button"
              onClick={() => setLogoutConfirmOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3.5 py-2 text-xs font-semibold text-[#DC2626] hover:bg-[#FEE2E2]"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>{lang === 'ar' ? 'تسجيل الخروج' : 'Logout'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Organized Account Sections */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <aside className="rounded-2xl border border-[#E5E7EB] bg-white p-2 lg:col-span-4">
          <div className="space-y-1">
            {navItems.map(({ id, ar, en, Icon }) => {
              const active = activeSection === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveSection(id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-start text-xs font-semibold transition-colors ${
                    active ? 'bg-[#ECFDF5] text-[#059669]' : 'text-[#4B5563] hover:bg-[#F8F9FA]'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{lang === 'ar' ? ar : en}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 lg:col-span-8">
          {activeSection === 'info' && (
            <div className="space-y-4">
              <h2 className="font-display text-base font-bold text-[#141518]">
                {lang === 'ar' ? 'معلومات الحساب' : 'Account Information'}
              </h2>
              <div className="grid grid-cols-1 gap-4 text-xs sm:grid-cols-2">
                <div className="rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] p-4">
                  <div className="text-[#6B7280]">{lang === 'ar' ? 'الاسم الكامل' : 'Full Name'}</div>
                  <div className="mt-1 font-bold text-[#141518]">{profile.name}</div>
                </div>
                <div className="rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] p-4">
                  <div className="text-[#6B7280]">{lang === 'ar' ? 'اسم المستخدم' : 'Username'}</div>
                  <div className="mt-1 font-mono-data font-bold text-[#141518]" dir="ltr">{profile.username}</div>
                </div>
                <div className="rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] p-4">
                  <div className="text-[#6B7280]">{lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}</div>
                  <div className="mt-1 font-mono-data font-bold text-[#141518]" dir="ltr">{profile.email}</div>
                </div>
                <div className="rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] p-4">
                  <div className="text-[#6B7280]">{lang === 'ar' ? 'رقم الهاتف' : 'Phone'}</div>
                  <div className="mt-1 font-mono-data font-bold text-[#141518]" dir="ltr">{profile.phone}</div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'privacy' && (
            <div className="space-y-4">
              <h2 className="font-display text-base font-bold text-[#141518]">
                {lang === 'ar' ? 'الأمان والخصوصية' : 'Privacy & Security'}
              </h2>
              <div className="divide-y divide-[#F3F4F6] text-xs">
                {(
                  [
                    { key: 'publicProfile', ar: 'إظهار الملف الشخصي للعامة', en: 'Public profile visibility' },
                    { key: 'allowDirectMessages', ar: 'السماح بالرسائل المباشرة من المشترين', en: 'Allow direct buyer messages' },
                    { key: 'twoFactorEnabled', ar: 'تفعيل التحقق بخطوتين (2FA)', en: 'Two-factor authentication (2FA)' },
                    { key: 'showOnlineStatus', ar: 'إظهار حالة التواجد في المحادثات', en: 'Show active status in chats' },
                  ] as const
                ).map((item) => (
                  <div key={item.key} className="flex items-center justify-between py-3.5">
                    <span className="font-semibold text-[#141518]">{lang === 'ar' ? item.ar : item.en}</span>
                    <button
                      type="button"
                      onClick={() => togglePrivacy(item.key)}
                      className={`rounded-lg px-3 py-1.5 font-semibold ${
                        profile.privacy[item.key]
                          ? 'bg-[#059669] text-white'
                          : 'border border-[#D1D5DB] bg-[#F8F9FA] text-[#4B5563]'
                      }`}
                    >
                      {profile.privacy[item.key] ? (lang === 'ar' ? 'مفعل' : 'Enabled') : (lang === 'ar' ? 'معطل' : 'Off')}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="space-y-4">
              <h2 className="font-display text-base font-bold text-[#141518]">
                {lang === 'ar' ? 'تفضيلات الإشعارات' : 'Notification Preferences'}
              </h2>
              <div className="divide-y divide-[#F3F4F6] text-xs">
                {(
                  [
                    { key: 'orders', ar: 'تحديثات الطلبات والدفع', en: 'Order & payment status updates' },
                    { key: 'channelPosts', ar: 'منشورات القنوات المتابَعة', en: 'New posts from followed channels' },
                    { key: 'liveBroadcasts', ar: 'بدء البث المباشر في القنوات', en: 'Live broadcast alerts' },
                    { key: 'directMessages', ar: 'الرسائل المباشرة ومجموعات النقاش', en: 'Direct messages & linked groups' },
                  ] as const
                ).map((item) => (
                  <div key={item.key} className="flex items-center justify-between py-3.5">
                    <span className="font-semibold text-[#141518]">{lang === 'ar' ? item.ar : item.en}</span>
                    <button
                      type="button"
                      onClick={() => toggleNotification(item.key)}
                      className={`rounded-lg px-3 py-1.5 font-semibold ${
                        profile.notifications[item.key]
                          ? 'bg-[#059669] text-white'
                          : 'border border-[#D1D5DB] bg-[#F8F9FA] text-[#4B5563]'
                      }`}
                    >
                      {profile.notifications[item.key] ? (lang === 'ar' ? 'مفعل' : 'On') : (lang === 'ar' ? 'صامت' : 'Muted')}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'language' && (
            <div className="space-y-4">
              <h2 className="font-display text-base font-bold text-[#141518]">
                {lang === 'ar' ? 'اختيار اللغة والاتجاه' : 'Language & Direction'}
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => onChangeLang('ar')}
                  className={`rounded-xl border p-4 text-start transition-colors ${
                    lang === 'ar' ? 'border-[#059669] bg-[#ECFDF5]' : 'border-[#E5E7EB]'
                  }`}
                >
                  <div className="text-sm font-bold text-[#141518]">العربية (RTL)</div>
                  <div className="mt-1 text-xs text-[#6B7280]">الواجهة العربية الكاملة من اليمين إلى اليسار</div>
                </button>
                <button
                  type="button"
                  onClick={() => onChangeLang('en')}
                  className={`rounded-xl border p-4 text-start transition-colors ${
                    lang === 'en' ? 'border-[#059669] bg-[#ECFDF5]' : 'border-[#E5E7EB]'
                  }`}
                >
                  <div className="text-sm font-bold text-[#141518]">English (LTR)</div>
                  <div className="mt-1 text-xs text-[#6B7280]">Full left-to-right English interface</div>
                </button>
              </div>
            </div>
          )}

          {activeSection === 'devices' && (
            <div className="space-y-4">
              <h2 className="font-display text-base font-bold text-[#141518]">
                {lang === 'ar' ? 'الأجهزة المتصلة والجلسات النشطة' : 'Connected Devices & Active Sessions'}
              </h2>
              <div className="divide-y divide-[#F3F4F6] text-xs">
                {sessions.map((s) => (
                  <div key={s.id} className="flex items-center justify-between py-3.5">
                    <div>
                      <div className="font-bold text-[#141518]">
                        {s.device} · {s.browser}
                      </div>
                      <div className="text-[#6B7280]">
                        {s.location} · {s.lastActive}
                      </div>
                    </div>
                    {s.current ? (
                      <span className="font-semibold text-[#059669]">
                        {lang === 'ar' ? 'الجلسة الحالية' : 'Current session'}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onRevokeSession(s.id)}
                        className="rounded-lg border border-[#FECACA] px-3 py-1 font-semibold text-[#DC2626]"
                      >
                        {lang === 'ar' ? 'إنهاء الجلسة' : 'Revoke'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'support' && (
            <div className="space-y-4">
              <h2 className="font-display text-base font-bold text-[#141518]">
                {lang === 'ar' ? 'المساعدة والدعم الفني' : 'Help & Support'}
              </h2>
              {supportSent && (
                <div className="rounded-xl border border-[#A7F3D0] bg-[#ECFDF5] px-4 py-3 text-xs text-[#065F46]">
                  {lang === 'ar' ? 'تم استلام طلب الدعم وحفظه في الخادم.' : 'Support ticket saved to backend.'}
                </div>
              )}
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!supportSubject.trim() || !supportMessage.trim()) return;
                  await onSubmitSupport(supportSubject.trim(), supportMessage.trim());
                  setSupportSubject('');
                  setSupportMessage('');
                  setSupportSent(true);
                }}
                className="space-y-3"
              >
                <input
                  type="text"
                  required
                  value={supportSubject}
                  onChange={(e) => setSupportSubject(e.target.value)}
                  placeholder={lang === 'ar' ? 'عنوان الاستفسار أو المشكلة' : 'Subject'}
                  className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-xs"
                />
                <textarea
                  rows={3}
                  required
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  placeholder={lang === 'ar' ? 'اشرح تفاصيل استفسارك...' : 'Describe your inquiry...'}
                  className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-xs"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-[#059669] px-4 py-2 text-xs font-semibold text-white hover:bg-[#047857]"
                >
                  {lang === 'ar' ? 'إرسال طلب الدعم' : 'Submit Ticket'}
                </button>
              </form>

              {supportTickets.length > 0 && (
                <div className="border-t border-[#E5E7EB] pt-3">
                  <div className="mb-2 text-xs font-bold text-[#141518]">
                    {lang === 'ar' ? 'التذاكر المرسلة' : 'Submitted Tickets'}
                  </div>
                  <div className="space-y-2 text-xs">
                    {supportTickets.map((tk) => (
                      <div key={tk.id} className="rounded-lg border border-[#E5E7EB] bg-[#F8F9FA] p-3">
                        <div className="flex items-center justify-between font-bold text-[#141518]">
                          <span>{tk.subject}</span>
                          <span className="text-[#059669]">{tk.createdAt}</span>
                        </div>
                        <p className="mt-1 text-[#4B5563]">{tk.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Dialog */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <form
            onSubmit={handleSaveEdit}
            className="w-full max-w-md space-y-3 rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <h3 className="font-display text-base font-bold text-[#141518]">
                {lang === 'ar' ? 'تعديل الملف الشخصي' : 'Edit Profile'}
              </h3>
              <button type="button" onClick={() => setEditOpen(false)} className="text-[#6B7280]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <input
              type="text"
              required
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder={lang === 'ar' ? 'الاسم' : 'Name'}
              className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-xs"
            />
            <input
              type="text"
              dir="ltr"
              required
              value={draftUsername}
              onChange={(e) => setDraftUsername(e.target.value)}
              placeholder="@username"
              className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 font-mono-data text-xs"
            />
            <input
              type="email"
              dir="ltr"
              value={draftEmail}
              onChange={(e) => setDraftEmail(e.target.value)}
              placeholder="Email"
              className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 font-mono-data text-xs"
            />
            <input
              type="text"
              dir="ltr"
              value={draftPhone}
              onChange={(e) => setDraftPhone(e.target.value)}
              placeholder="Phone"
              className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 font-mono-data text-xs"
            />
            <textarea
              rows={3}
              value={draftBio}
              onChange={(e) => setDraftBio(e.target.value)}
              placeholder={lang === 'ar' ? 'النبذة التعريفية' : 'Biography'}
              className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-xs"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="rounded-lg border border-[#D1D5DB] px-4 py-2 text-xs font-semibold"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                className="rounded-lg bg-[#059669] px-4 py-2 text-xs font-semibold text-white"
              >
                {t.common.save}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Logout Confirmation Dialog */}
      {logoutConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm space-y-4 rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-xl">
            <h3 className="font-display text-base font-bold text-[#141518]">
              {lang === 'ar' ? 'تأكيد تسجيل الخروج' : 'Confirm Logout'}
            </h3>
            <p className="text-xs leading-relaxed text-[#4B5563]">
              {lang === 'ar'
                ? 'سيتم إنهاء الجلسة الحالية في المتصفح وفصل ارتباط الجلسة المؤقتة.'
                : 'Your current session will end and you will return to the sign-in screen.'}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setLogoutConfirmOpen(false)}
                className="rounded-lg border border-[#D1D5DB] px-4 py-2 text-xs font-semibold"
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                onClick={() => {
                  setLogoutConfirmOpen(false);
                  onLogout();
                }}
                className="rounded-lg bg-[#DC2626] px-4 py-2 text-xs font-semibold text-white"
              >
                {lang === 'ar' ? 'تسجيل الخروج' : 'Logout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
