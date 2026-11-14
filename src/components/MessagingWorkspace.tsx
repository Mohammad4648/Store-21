import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCheck,
  CheckCircle2,
  Edit3,
  FileText,
  Forward,
  Lock,
  MessageCircle,
  Mic,
  Paperclip,
  Pin,
  Plus,
  Reply,
  Search,
  Send,
  Settings2,
  Shield,
  ShoppingBag,
  Square,
  Store,
  ThumbsUp,
  Trash2,
  Users,
  VolumeX,
  X,
} from 'lucide-react';
import { UI_COPY } from '../i18n/translations';
import {
  ChatMessage,
  ChatThread,
  ForwardedChannelPostSummary,
  GroupPermissions,
  GroupPostingPolicy,
  Language,
  MessageMediaAttachment,
  Product,
  StoreChannel,
} from '../types/commerce';
import {
  canUserPostInGroup,
  ChatKindFilter,
  filterChatThreads,
  filterMessagesInThread,
  localizeTimestamp,
  normalizeHandle,
} from '../utils/commerceLogic';

interface MessagingWorkspaceProps {
  lang: Language;
  userHandle: string;
  threads: ChatThread[];
  messages: ChatMessage[];
  products: Product[];
  channels: StoreChannel[];
  activeThreadId: string;
  onSelectThread: (threadId: string) => void;
  onSendMessage: (payload: {
    threadId: string;
    text: string;
    attachedProductId?: string;
    replyTo?: ChatMessage['replyTo'];
    forwardedFrom?: string;
    forwardedPost?: ForwardedChannelPostSummary;
    media?: MessageMediaAttachment;
  }) => Promise<boolean> | void;
  onEditMessage: (msgId: string, nextText: string) => Promise<void>;
  onDeleteMessage: (msgId: string) => Promise<void>;
  onReactMessage: (msgId: string) => void;
  onTogglePin: (msgId: string) => void;
  onOpenProduct: (product: Product) => void;
  onOpenChannel: (channelId: string) => void;
  onUpdateGroupPermissions: (threadId: string, permissions: Partial<GroupPermissions>) => Promise<void>;
  onUpdateMemberRole?: (
    channelId: string,
    memberId: string,
    patch: { role?: 'moderator' | 'member'; muted?: boolean; canPost?: boolean }
  ) => Promise<void>;
  onJoinChannelGroup: (channelId: string) => Promise<void>;
}

export const MessagingWorkspace: React.FC<MessagingWorkspaceProps> = ({
  lang,
  userHandle,
  threads,
  messages,
  products,
  channels,
  activeThreadId,
  onSelectThread,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onReactMessage,
  onTogglePin,
  onOpenProduct,
  onOpenChannel,
  onUpdateGroupPermissions,
  onUpdateMemberRole,
  onJoinChannelGroup,
}) => {
  const t = UI_COPY[lang];
  const [kindFilter, setKindFilter] = useState<ChatKindFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [inChatSearchOpen, setInChatSearchOpen] = useState(false);
  const [inChatSearch, setInChatSearch] = useState('');
  const [msgText, setMsgText] = useState('');
  const [attachedProductId, setAttachedProductId] = useState('');
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [forwardingMsg, setForwardingMsg] = useState<ChatMessage | null>(null);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState('');
  const [groupInfoOpen, setGroupInfoOpen] = useState(false);
  const [mobileShowThread, setMobileShowThread] = useState(false);
  const [pendingMedia, setPendingMedia] = useState<MessageMediaAttachment | null>(null);

  // Voice note recorder
  const [recording, setRecording] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const filteredThreads = useMemo(
    () => filterChatThreads(threads, kindFilter, searchTerm),
    [threads, kindFilter, searchTerm]
  );

  // Channels with linked groups that aren't yet open as threads (discovery entry)
  const discoverableGroups = useMemo(() => {
    if (kindFilter === 'direct') return [];
    const q = searchTerm.trim().toLowerCase();
    return channels
      .filter((ch) => ch.linkedGroupEnabled)
      .filter((ch) => !threads.some((tr) => tr.kind === 'group' && tr.channelId === ch.id))
      .filter((ch) => {
        if (!q) return true;
        return (
          ch.linkedGroupName.toLowerCase().includes(q) ||
          ch.linkedGroupNameEn.toLowerCase().includes(q) ||
          ch.name.toLowerCase().includes(q)
        );
      });
  }, [channels, threads, kindFilter, searchTerm]);

  const activeThread =
    threads.find((tr) => tr.id === activeThreadId) || filteredThreads[0] || threads[0];

  const threadMessages = useMemo(
    () =>
      activeThread
        ? filterMessagesInThread(messages, activeThread.id, inChatSearchOpen ? inChatSearch : '')
        : [],
    [messages, activeThread, inChatSearchOpen, inChatSearch]
  );

  const linkedChannel = activeThread?.channelId
    ? channels.find((c) => c.id === activeThread.channelId)
    : undefined;

  const postCheck = useMemo(
    () => canUserPostInGroup(activeThread, linkedChannel, userHandle),
    [activeThread, linkedChannel, userHandle]
  );

  const canAttachMedia = postCheck.isAdmin || postCheck.permissions.allowMedia;
  const canAttachProduct = postCheck.isAdmin || postCheck.permissions.allowProductLinks;
  const canReply = postCheck.isAdmin || postCheck.permissions.allowMemberReplies;

  const directCount = threads.filter((tr) => tr.kind === 'direct').length;
  const groupCount = threads.filter((tr) => tr.kind === 'group').length;

  const BackIcon = lang === 'ar' ? ArrowRight : ArrowLeft;

  const policyLabel = (policy: GroupPostingPolicy) => {
    if (policy === 'admins_only') {
      return lang === 'ar' ? 'النشر للمشرفين فقط' : 'Admins only';
    }
    if (policy === 'approved_only') {
      return lang === 'ar' ? 'للأعضاء المصرّح لهم' : 'Approved members';
    }
    return lang === 'ar' ? 'مفتوحة للجميع' : 'All members';
  };

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    let kind: MessageMediaAttachment['kind'] = 'file';
    if (file.type.startsWith('image/')) kind = 'image';
    else if (file.type.startsWith('video/')) kind = 'video';
    else if (file.type.startsWith('audio/')) kind = 'audio';

    setPendingMedia({
      kind,
      name: file.name,
      url,
      sizeLabel: `${Math.max(1, Math.round(file.size / 1024))} KB`,
    });
    e.target.value = '';
  };

  const toggleVoiceRecording = async () => {
    setVoiceError('');
    if (recording && recorderRef.current) {
      recorderRef.current.stop();
      setRecording(false);
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setVoiceError(
        lang === 'ar'
          ? 'تسجيل الصوت غير متاح في هذا المتصفح.'
          : 'Voice recording is unavailable in this browser.'
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      const startedAt = Date.now();

      rec.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data);
      };
      rec.onstop = () => {
        stream.getTracks().forEach((tr) => tr.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const durationSec = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
        setPendingMedia({
          kind: 'audio',
          name: lang === 'ar' ? 'رسالة صوتية' : 'Voice message',
          url,
          durationSec,
        });
      };

      recorderRef.current = rec;
      rec.start();
      setRecording(true);
    } catch {
      setVoiceError(
        lang === 'ar'
          ? 'تعذر الوصول للميكروفون لإرسال رسالة صوتية.'
          : 'Microphone permission denied for voice message.'
      );
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThread || !postCheck.allowed) return;
    if (!msgText.trim() && !attachedProductId && !pendingMedia) return;

    await onSendMessage({
      threadId: activeThread.id,
      text: msgText.trim(),
      attachedProductId: canAttachProduct && attachedProductId ? attachedProductId : undefined,
      replyTo:
        canReply && replyingTo
          ? {
              id: replyingTo.id,
              authorName: replyingTo.authorName,
              text: replyingTo.text.slice(0, 80),
            }
          : undefined,
      media: canAttachMedia && pendingMedia ? pendingMedia : undefined,
    });

    setMsgText('');
    setAttachedProductId('');
    setProductPickerOpen(false);
    setReplyingTo(null);
    setPendingMedia(null);
  };

  const handleSaveEdit = async (e: React.FormEvent, msgId: string) => {
    e.preventDefault();
    if (!editingDraft.trim()) return;
    await onEditMessage(msgId, editingDraft.trim());
    setEditingMsgId(null);
    setEditingDraft('');
  };

  const selectedProductObj = attachedProductId
    ? products.find((p) => p.id === attachedProductId)
    : undefined;

  return (
    <section className="overflow-hidden border-y border-[#E5E7EB] bg-white sm:rounded-2xl sm:border lg:h-[calc(100vh-7.5rem)] lg:min-h-[620px] lg:max-h-[820px]">
      <div className="grid h-full grid-cols-1 lg:grid-cols-12">
        {/* Conversation & Group Entry Sidebar */}
        <aside
          className={`flex flex-col border-[#E5E7EB] bg-[#F8F9FA] lg:col-span-4 lg:h-full lg:overflow-hidden lg:border-e ${
            mobileShowThread ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <div className="space-y-3 border-b border-[#E5E7EB] bg-white p-3.5 sm:p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#ECFDF5] text-[#059669]">
                  <MessageCircle className="h-4 w-4" />
                </div>
                <div>
                  <h1 className="font-display text-sm font-extrabold text-[#141518] sm:text-base">
                    {lang === 'ar' ? 'المحادثات والمجموعات' : 'Chats & Groups'}
                  </h1>
                  <p className="text-[11px] text-[#6B7280] tabular-nums">
                    {lang === 'ar'
                      ? `${directCount} خاصة · ${groupCount} مجموعة`
                      : `${directCount} direct · ${groupCount} groups`}
                  </p>
                </div>
              </div>
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6B7280]" />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={
                  lang === 'ar'
                    ? 'ابحث عن محادثة أو مجموعة...'
                    : 'Search private & group chats...'
                }
                className="w-full rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] py-2 ps-9 pe-3 text-xs text-[#141518] outline-none transition-colors focus:border-[#059669] focus:bg-white"
              />
            </div>

            {/* Unified Segmented Entry Tabs */}
            <div
              role="tablist"
              aria-label={lang === 'ar' ? 'تصفية المحادثات' : 'Filter conversations'}
              className="grid grid-cols-3 gap-1 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] p-1 text-[11px] font-semibold"
            >
              {(
                [
                  { id: 'all', ar: 'الكل', en: 'All', count: threads.length },
                  { id: 'direct', ar: 'الخاصة', en: 'Direct', count: directCount },
                  { id: 'group', ar: 'المجموعات', en: 'Groups', count: groupCount },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={kindFilter === tab.id}
                  onClick={() => setKindFilter(tab.id)}
                  className={`flex min-h-[34px] items-center justify-center gap-1 rounded-lg px-2 py-1.5 transition-colors whitespace-nowrap ${
                    kindFilter === tab.id
                      ? 'bg-[#059669] text-white shadow-2xs'
                      : 'text-[#6B7280] hover:text-[#141518]'
                  }`}
                >
                  <span>{lang === 'ar' ? tab.ar : tab.en}</span>
                  <span
                    className={`font-mono-data text-[10px] tabular-nums ${
                      kindFilter === tab.id ? 'text-white/90' : 'text-[#9CA3AF]'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 divide-y divide-[#E5E7EB]/70 overflow-y-auto">
            {filteredThreads.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#6B7280]">
                {lang === 'ar' ? 'لا توجد محادثات مطابقة.' : 'No matching conversations.'}
              </div>
            ) : (
              filteredThreads.map((thr) => {
                const selected = activeThread?.id === thr.id;
                const lastThreadMsg = [...messages].reverse().find((m) => m.threadId === thr.id);
                const thrCh = thr.channelId
                  ? channels.find((c) => c.id === thr.channelId)
                  : undefined;
                const thrCheck = canUserPostInGroup(thr, thrCh, userHandle);
                const previewText = lastThreadMsg
                  ? thr.kind === 'group' && lastThreadMsg.authorName
                    ? `${lastThreadMsg.authorName}: ${
                        lastThreadMsg.text ||
                        (lastThreadMsg.forwardedPost
                          ? lastThreadMsg.forwardedPost.text
                          : lang === 'ar'
                          ? 'مرفق'
                          : 'Attachment')
                      }`
                    : lastThreadMsg.text
                  : lang === 'ar'
                  ? thr.subtitle
                  : thr.subtitleEn;

                return (
                  <button
                    key={thr.id}
                    type="button"
                    onClick={() => {
                      onSelectThread(thr.id);
                      setGroupInfoOpen(false);
                      setMobileShowThread(true);
                    }}
                    className={`flex min-h-[72px] w-full items-center gap-3 px-3.5 py-3 text-start transition-colors ${
                      selected
                        ? 'bg-[#ECFDF5]/80 lg:bg-white'
                        : 'bg-white/40 hover:bg-white'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={thr.avatar}
                        alt={lang === 'ar' ? thr.title : thr.titleEn}
                        referrerPolicy="no-referrer"
                        className="h-12 w-12 rounded-full border border-[#E5E7EB] object-cover"
                      />
                      {thr.kind === 'direct' && thr.online && (
                        <span
                          aria-label="Online"
                          className="absolute bottom-0 end-0 h-3 w-3 rounded-full border-2 border-white bg-[#10B981]"
                        />
                      )}
                      {thr.kind === 'group' && (
                        <span
                          aria-hidden="true"
                          className="absolute -bottom-0.5 -end-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-[#141518] text-white"
                        >
                          <Users className="h-2.5 w-2.5" />
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-1">
                          <span className="truncate text-xs font-bold text-[#141518] sm:text-[13px]">
                            {lang === 'ar' ? thr.title : thr.titleEn}
                          </span>
                          {thr.verified && (
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#059669]" />
                          )}
                        </div>
                        <span className="shrink-0 text-[10px] text-[#9CA3AF] tabular-nums">
                          {lastThreadMsg
                            ? localizeTimestamp(lastThreadMsg.timestamp, lang)
                            : ''}
                        </span>
                      </div>

                      <div className="mt-1 flex items-center justify-between gap-2">
                        <p className="truncate text-[11px] text-[#6B7280]">{previewText}</p>
                        {thr.unreadCount > 0 && (
                          <span className="flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-[#059669] px-1.5 font-mono-data text-[10px] font-bold text-white tabular-nums">
                            {thr.unreadCount}
                          </span>
                        )}
                      </div>

                      {thr.kind === 'group' && (
                        <div className="mt-1 flex items-center gap-1.5 text-[10px] text-[#6B7280] tabular-nums">
                          <span>
                            {(thr.membersCount || 0).toLocaleString()}{' '}
                            {lang === 'ar' ? 'عضو' : 'members'}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span
                            className={
                              thrCheck.permissions.postingPolicy === 'admins_only'
                                ? 'font-semibold text-[#B45309]'
                                : 'text-[#059669]'
                            }
                          >
                            {policyLabel(thrCheck.permissions.postingPolicy)}
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            )}

            {/* Discoverable Channel Groups not yet in user's active list */}
            {discoverableGroups.length > 0 && (
              <div className="bg-[#F8F9FA] p-3.5">
                <div className="mb-2 text-[11px] font-bold text-[#4B5563]">
                  {lang === 'ar' ? 'مجموعات قنوات يمكنك الانضمام إليها' : 'Discover Channel Groups'}
                </div>
                <div className="space-y-2">
                  {discoverableGroups.map((ch) => (
                    <div
                      key={ch.id}
                      className="flex items-center justify-between gap-2.5 rounded-xl border border-[#E5E7EB] bg-white p-2.5"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <img
                          src={ch.avatarImage}
                          alt={lang === 'ar' ? ch.linkedGroupName : ch.linkedGroupNameEn}
                          referrerPolicy="no-referrer"
                          className="h-9 w-9 shrink-0 rounded-full object-cover"
                        />
                        <div className="min-w-0">
                          <div className="truncate text-xs font-bold text-[#141518]">
                            {lang === 'ar' ? ch.linkedGroupName : ch.linkedGroupNameEn}
                          </div>
                          <div className="truncate text-[10px] text-[#6B7280]">
                            {lang === 'ar' ? ch.name : ch.nameEn}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          await onJoinChannelGroup(ch.id);
                          setMobileShowThread(true);
                        }}
                        className="inline-flex min-h-[34px] shrink-0 items-center gap-1 rounded-lg bg-[#059669] px-3 py-1 text-[11px] font-semibold text-white hover:bg-[#047857] whitespace-nowrap"
                      >
                        <Plus className="h-3 w-3" />
                        <span>{lang === 'ar' ? 'دخول' : 'Join'}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Active Conversation Pane (Full-Screen on Mobile when active) */}
        {activeThread ? (
          <div
            className={`${
              mobileShowThread
                ? 'fixed inset-0 z-40 flex flex-col bg-white lg:static lg:z-auto'
                : 'hidden lg:flex'
            } flex-col bg-white lg:col-span-8 lg:h-full lg:overflow-hidden`}
          >
            {/* Conversation Header */}
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[#E5E7EB] bg-white px-3 py-2.5 sm:px-5 sm:py-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setMobileShowThread(false)}
                  aria-label={lang === 'ar' ? 'العودة للقائمة' : 'Back to list'}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#141518] hover:bg-[#F3F4F6] lg:hidden"
                >
                  <BackIcon className="h-5 w-5" />
                </button>
                <div className="relative shrink-0">
                  <img
                    src={activeThread.avatar}
                    alt={lang === 'ar' ? activeThread.title : activeThread.titleEn}
                    referrerPolicy="no-referrer"
                    className="h-10 w-10 rounded-full border border-[#E5E7EB] object-cover"
                  />
                  {activeThread.kind === 'direct' && activeThread.online && (
                    <span className="absolute bottom-0 end-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#10B981]" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <h2 className="truncate font-display text-sm font-bold text-[#141518]">
                      {lang === 'ar' ? activeThread.title : activeThread.titleEn}
                    </h2>
                    {activeThread.verified && (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#059669]" />
                    )}
                  </div>
                  <p className="truncate text-[11px] text-[#6B7280] tabular-nums">
                    {activeThread.kind === 'group' ? (
                      <>
                        {(activeThread.membersCount || linkedChannel?.members.length || 0).toLocaleString()}{' '}
                        {lang === 'ar' ? 'عضو' : 'members'} ·{' '}
                        <span className="font-medium text-[#059669]">
                          {policyLabel(postCheck.permissions.postingPolicy)}
                        </span>
                      </>
                    ) : activeThread.lastSeen ? (
                      lang === 'ar' ? (
                        activeThread.lastSeen
                      ) : (
                        activeThread.lastSeenEn
                      )
                    ) : lang === 'ar' ? (
                      activeThread.subtitle
                    ) : (
                      activeThread.subtitleEn
                    )}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setInChatSearchOpen((prev) => !prev);
                    setInChatSearch('');
                  }}
                  aria-label={lang === 'ar' ? 'بحث داخل المحادثة' : 'Search inside chat'}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
                    inChatSearchOpen
                      ? 'border-[#059669] bg-[#ECFDF5] text-[#059669]'
                      : 'border-[#E5E7EB] bg-[#F8F9FA] text-[#141518] hover:border-[#059669]'
                  }`}
                >
                  <Search className="h-4 w-4" />
                </button>
                {activeThread.kind === 'group' && (
                  <button
                    type="button"
                    onClick={() => setGroupInfoOpen((p) => !p)}
                    aria-label={lang === 'ar' ? 'إعدادات وأعضاء المجموعة' : 'Group Settings & Members'}
                    className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                      groupInfoOpen
                        ? 'border-[#059669] bg-[#ECFDF5] text-[#059669]'
                        : 'border-[#E5E7EB] bg-[#F8F9FA] text-[#141518] hover:border-[#059669]'
                    }`}
                  >
                    <Settings2 className="h-3.5 w-3.5 text-[#059669]" />
                    <span className="hidden sm:inline">
                      {lang === 'ar' ? 'الصلاحيات والأعضاء' : 'Settings'}
                    </span>
                  </button>
                )}
                {activeThread.channelId && (
                  <button
                    type="button"
                    onClick={() => onOpenChannel(activeThread.channelId!)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-[#F8F9FA] px-2.5 text-xs font-semibold text-[#141518] hover:border-[#059669] whitespace-nowrap"
                  >
                    <Store className="h-3.5 w-3.5 text-[#059669]" />
                    <span className="hidden sm:inline">{lang === 'ar' ? 'القناة' : 'Channel'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* In-conversation Search Input */}
            {inChatSearchOpen && (
              <div className="flex shrink-0 items-center gap-2 border-b border-[#E5E7EB] bg-[#F8F9FA] px-4 py-2 sm:px-5">
                <Search className="h-3.5 w-3.5 text-[#6B7280]" />
                <input
                  type="search"
                  autoFocus
                  value={inChatSearch}
                  onChange={(e) => setInChatSearch(e.target.value)}
                  placeholder={lang === 'ar' ? 'ابحث داخل هذه المحادثة...' : 'Search messages in this chat...'}
                  className="flex-1 bg-transparent text-xs text-[#141518] outline-none"
                />
                {inChatSearch && (
                  <span className="font-mono-data text-[11px] text-[#6B7280]">
                    {threadMessages.length}
                  </span>
                )}
              </div>
            )}

            {/* Group Permissions & Members Drawer */}
            {activeThread.kind === 'group' && groupInfoOpen && (
              <div className="max-h-72 shrink-0 overflow-y-auto border-b border-[#E5E7EB] bg-[#F8F9FA] px-4 py-3.5 text-xs sm:px-5">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-[#141518]">
                    <Shield className="h-4 w-4 text-[#059669]" />
                    <span>
                      {lang === 'ar'
                        ? 'تخصيص صلاحيات النشر والأعضاء'
                        : 'Group Posting Permissions & Members'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setGroupInfoOpen(false)}
                    className="rounded-lg p-1 text-[#6B7280] hover:bg-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Posting Policy Selector */}
                <div className="space-y-3 rounded-xl border border-[#E5E7EB] bg-white p-3">
                  <div>
                    <div className="mb-1.5 text-[11px] font-bold text-[#4B5563]">
                      {lang === 'ar' ? 'من يمكنه إرسال الرسائل في المجموعة؟' : 'Who can send messages?'}
                    </div>
                    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
                      {(
                        [
                          { id: 'all', ar: 'جميع الأعضاء', en: 'All members' },
                          { id: 'admins_only', ar: 'المشرفون فقط', en: 'Admins only' },
                          { id: 'approved_only', ar: 'المصرّح لهم فقط', en: 'Approved members' },
                        ] as const
                      ).map((opt) => {
                        const active = postCheck.permissions.postingPolicy === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            disabled={!postCheck.isAdmin}
                            onClick={() =>
                              onUpdateGroupPermissions(activeThread.id, { postingPolicy: opt.id })
                            }
                            className={`rounded-lg border px-2.5 py-2 text-start text-[11px] font-semibold transition-colors disabled:opacity-60 ${
                              active
                                ? 'border-[#059669] bg-[#ECFDF5] text-[#059669]'
                                : 'border-[#E5E7EB] bg-[#F8F9FA] text-[#4B5563]'
                            }`}
                          >
                            {lang === 'ar' ? opt.ar : opt.en}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 border-t border-[#F3F4F6] pt-2.5 sm:grid-cols-3">
                    {(
                      [
                        {
                          key: 'allowMedia',
                          ar: 'الصور والوسائط',
                          en: 'Media & files',
                        },
                        {
                          key: 'allowProductLinks',
                          ar: 'إرفاق المنتجات والتحويل',
                          en: 'Product links & forwards',
                        },
                        {
                          key: 'allowMemberReplies',
                          ar: 'الردود على الرسائل',
                          en: 'Message replies',
                        },
                      ] as const
                    ).map((toggle) => {
                      const on = postCheck.permissions[toggle.key];
                      return (
                        <button
                          key={toggle.key}
                          type="button"
                          disabled={!postCheck.isAdmin}
                          onClick={() =>
                            onUpdateGroupPermissions(activeThread.id, { [toggle.key]: !on })
                          }
                          className="flex items-center justify-between gap-2 rounded-lg border border-[#E5E7EB] bg-[#F8F9FA] px-2.5 py-1.5 text-[11px] disabled:opacity-60"
                        >
                          <span className="font-medium text-[#141518]">
                            {lang === 'ar' ? toggle.ar : toggle.en}
                          </span>
                          <span
                            className={`font-bold ${on ? 'text-[#059669]' : 'text-[#9CA3AF]'}`}
                          >
                            {on ? (lang === 'ar' ? 'مسموح' : 'On') : lang === 'ar' ? 'مقفول' : 'Off'}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {!postCheck.isAdmin && (
                    <p className="text-[11px] text-[#6B7280]">
                      {lang === 'ar'
                        ? 'تعديل إعدادات المجموعة متاح لمالك القناة والمشرفين فقط.'
                        : 'Only channel owners and moderators can change group permissions.'}
                    </p>
                  )}
                </div>

                {/* Members list */}
                {linkedChannel && (
                  <div className="mt-3 space-y-1.5">
                    <div className="font-bold text-[#141518]">
                      {lang === 'ar' ? 'أعضاء المجموعة' : 'Members'} ({linkedChannel.members.length})
                    </div>
                    <div className="divide-y divide-[#E5E7EB]/60 rounded-xl border border-[#E5E7EB] bg-white">
                      {linkedChannel.members.map((m) => {
                        const isSelf = normalizeHandle(m.handle) === normalizeHandle(userHandle);
                        return (
                          <div
                            key={m.id}
                            className="flex flex-wrap items-center justify-between gap-2 px-3 py-2"
                          >
                            <div className="min-w-0">
                              <span className="font-semibold text-[#141518]">{m.name}</span>{' '}
                              <span className="text-[#6B7280]">
                                · {m.handle} ·{' '}
                                {m.role === 'owner'
                                  ? lang === 'ar'
                                    ? 'مالك'
                                    : 'Owner'
                                  : m.role === 'moderator'
                                  ? lang === 'ar'
                                    ? 'مشرف'
                                    : 'Admin'
                                  : lang === 'ar'
                                  ? 'عضو'
                                  : 'Member'}
                              </span>
                            </div>
                            {postCheck.isAdmin && m.role !== 'owner' && !isSelf && onUpdateMemberRole && (
                              <div className="flex items-center gap-1.5">
                                {postCheck.permissions.postingPolicy === 'approved_only' && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onUpdateMemberRole(linkedChannel.id, m.id, {
                                        canPost: m.canPost === false,
                                      })
                                    }
                                    className={`rounded-md border px-2 py-1 text-[10px] font-semibold ${
                                      m.canPost !== false
                                        ? 'border-[#059669] bg-[#ECFDF5] text-[#059669]'
                                        : 'border-[#D1D5DB] text-[#6B7280]'
                                    }`}
                                  >
                                    {m.canPost !== false
                                      ? lang === 'ar'
                                        ? 'مصرّح بالنشر'
                                        : 'Can post'
                                      : lang === 'ar'
                                      ? 'السماح بالنشر'
                                      : 'Approve'}
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() =>
                                    onUpdateMemberRole(linkedChannel.id, m.id, {
                                      role: m.role === 'moderator' ? 'member' : 'moderator',
                                    })
                                  }
                                  className="rounded-md border border-[#E5E7EB] px-2 py-1 text-[10px] font-semibold text-[#141518] hover:border-[#059669]"
                                >
                                  {m.role === 'moderator'
                                    ? lang === 'ar'
                                      ? 'إزالة الإشراف'
                                      : 'Demote'
                                    : lang === 'ar'
                                    ? 'ترقية لمشرف'
                                    : 'Make Admin'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    onUpdateMemberRole(linkedChannel.id, m.id, { muted: !m.muted })
                                  }
                                  className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-semibold ${
                                    m.muted
                                      ? 'border-[#DC2626] bg-[#FEF2F2] text-[#DC2626]'
                                      : 'border-[#E5E7EB] text-[#6B7280]'
                                  }`}
                                >
                                  <VolumeX className="h-3 w-3" />
                                  <span>{m.muted ? (lang === 'ar' ? 'فك الكتم' : 'Unmute') : lang === 'ar' ? 'كتم' : 'Mute'}</span>
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Pinned Message Banner */}
            {(() => {
              const pinnedMsg = threadMessages.find((m) => m.pinned);
              if (!pinnedMsg) return null;
              return (
                <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#E5E7EB] bg-[#ECFDF5]/70 px-4 py-2 text-xs sm:px-5">
                  <div className="flex min-w-0 items-center gap-2">
                    <Pin className="h-3.5 w-3.5 shrink-0 text-[#059669]" />
                    <span className="shrink-0 font-bold text-[#059669]">{pinnedMsg.authorName}:</span>
                    <span className="truncate text-[#374151]">
                      {pinnedMsg.text || (lang === 'ar' ? 'رسالة مرفقة مثبتة' : 'Pinned attachment')}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Message Stream */}
            <div className="flex-1 space-y-2.5 overflow-y-auto bg-[#F0F2F1] px-3 py-4 sm:px-5">
              {threadMessages.length === 0 ? (
                <div className="flex h-full min-h-[220px] items-center justify-center text-xs text-[#6B7280]">
                  {inChatSearch
                    ? lang === 'ar'
                      ? 'لا توجد رسائل مطابقة للبحث.'
                      : 'No matching messages.'
                    : lang === 'ar'
                    ? 'لا توجد رسائل بعد. ابدأ المحادثة الآن.'
                    : 'No messages yet. Start the conversation below.'}
                </div>
              ) : (
                threadMessages.map((msg) => {
                  const isMe = msg.authorRole === 'me';
                  const isEditing = editingMsgId === msg.id;
                  const attached = msg.attachedProductId
                    ? products.find((p) => p.id === msg.attachedProductId)
                    : undefined;
                  const fwdProd = msg.forwardedPost?.productId
                    ? products.find((p) => p.id === msg.forwardedPost?.productId)
                    : undefined;

                  return (
                    <div
                      key={msg.id}
                      className={`group max-w-[88%] rounded-2xl border px-3.5 py-2.5 shadow-2xs transition-colors sm:max-w-lg ${
                        isMe
                          ? 'ms-auto rounded-te-xs border-[#B8E6D0] bg-[#E7F8F0]'
                          : 'me-auto rounded-ts-xs border-[#E5E7EB] bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 text-[11px] text-[#6B7280]">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <span className="truncate font-bold text-[#141518]">{msg.authorName}</span>
                          {msg.authorRole === 'seller' && (
                            <span className="shrink-0 font-semibold text-[#059669]">
                              · {lang === 'ar' ? 'مشرف' : 'Admin'}
                            </span>
                          )}
                          {msg.forwardedFrom && !msg.forwardedPost && (
                            <span className="truncate italic text-[#6B7280]">
                              · {lang === 'ar' ? `محوّلة من ${msg.forwardedFrom}` : `Forwarded from ${msg.forwardedFrom}`}
                            </span>
                          )}
                        </div>
                        <div className="flex shrink-0 items-center gap-1 tabular-nums">
                          {msg.edited && (
                            <span className="text-[10px] italic text-[#6B7280]">
                              {lang === 'ar' ? 'معدّلة' : 'edited'}
                            </span>
                          )}
                          <span>{localizeTimestamp(msg.timestamp, lang)}</span>
                          {isMe &&
                            (msg.deliveryStatus === 'sent' ? (
                              <Check className="h-3 w-3 text-[#6B7280]" />
                            ) : (
                              <CheckCheck
                                className={`h-3.5 w-3.5 ${
                                  msg.deliveryStatus === 'read' ? 'text-[#059669]' : 'text-[#6B7280]'
                                }`}
                              />
                            ))}
                        </div>
                      </div>

                      {msg.replyTo && (
                        <div className="mt-1.5 rounded-lg border border-[#E5E7EB] bg-black/[0.03] px-2.5 py-1.5 text-[11px]">
                          <div className="font-bold text-[#059669]">{msg.replyTo.authorName}</div>
                          <div className="truncate text-[#4B5563]">{msg.replyTo.text}</div>
                        </div>
                      )}

                      {/* Forwarded Channel Post Card */}
                      {msg.forwardedPost && (
                        <div className="mt-2 overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
                          <div className="flex items-center justify-between gap-2 border-b border-[#F3F4F6] bg-[#F8F9FA] px-3 py-1.5 text-[11px]">
                            <div className="flex min-w-0 items-center gap-2">
                              <img
                                src={msg.forwardedPost.channelAvatar}
                                alt={msg.forwardedPost.channelName}
                                referrerPolicy="no-referrer"
                                className="h-5 w-5 shrink-0 rounded-full object-cover"
                              />
                              <span className="truncate font-bold text-[#141518]">
                                {msg.forwardedPost.channelName}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => onOpenChannel(msg.forwardedPost!.channelId)}
                              className="shrink-0 font-semibold text-[#059669] hover:underline whitespace-nowrap"
                            >
                              {lang === 'ar' ? 'فتح القناة' : 'Open'}
                            </button>
                          </div>
                          {msg.forwardedPost.image && (
                            <img
                              src={msg.forwardedPost.image}
                              alt={msg.forwardedPost.channelName}
                              referrerPolicy="no-referrer"
                              className="max-h-40 w-full object-cover"
                            />
                          )}
                          <div className="p-2.5 text-xs leading-relaxed text-[#374151]">
                            {msg.forwardedPost.text}
                          </div>
                          {fwdProd && (
                            <button
                              type="button"
                              onClick={() => onOpenProduct(fwdProd)}
                              className="flex w-full items-center justify-between border-t border-[#F3F4F6] px-3 py-2 text-start text-xs hover:bg-[#F8F9FA]"
                            >
                              <span className="truncate font-bold text-[#141518]">
                                {lang === 'ar' ? fwdProd.title : fwdProd.titleEn}
                              </span>
                              <span className="font-mono-data font-bold text-[#059669]">
                                ${fwdProd.priceUSD.toLocaleString()}
                              </span>
                            </button>
                          )}
                        </div>
                      )}

                      {isEditing ? (
                        <form onSubmit={(e) => handleSaveEdit(e, msg.id)} className="mt-2 flex items-center gap-2">
                          <input
                            type="text"
                            value={editingDraft}
                            onChange={(e) => setEditingDraft(e.target.value)}
                            className="min-w-0 flex-1 rounded-lg border border-[#059669] bg-white px-2.5 py-1.5 text-xs text-[#141518] outline-none"
                          />
                          <button
                            type="submit"
                            className="rounded-lg bg-[#059669] px-2.5 py-1.5 text-[11px] font-semibold text-white"
                          >
                            {t.common.save}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingMsgId(null)}
                            className="rounded-lg border border-[#D1D5DB] bg-white px-2 py-1.5 text-[11px] font-semibold"
                          >
                            {t.common.cancel}
                          </button>
                        </form>
                      ) : (
                        msg.text && (
                          <p className="mt-1 text-[13px] leading-relaxed text-[#1F2937] sm:text-sm">
                            {msg.text}
                          </p>
                        )
                      )}

                      {msg.media && (
                        <div className="mt-2 overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
                          {msg.media.kind === 'image' && (
                            <img
                              src={msg.media.url}
                              alt={msg.media.name}
                              className="max-h-56 w-full object-cover"
                            />
                          )}
                          {msg.media.kind === 'video' && (
                            <video src={msg.media.url} controls className="max-h-56 w-full" />
                          )}
                          {msg.media.kind === 'audio' && (
                            <div className="flex items-center gap-2 p-2">
                              <audio src={msg.media.url} controls className="h-8 w-full" />
                            </div>
                          )}
                          {msg.media.kind === 'file' && (
                            <a
                              href={msg.media.url}
                              download={msg.media.name}
                              className="flex items-center gap-2 p-2.5 text-xs font-semibold text-[#141518] hover:text-[#059669]"
                            >
                              <FileText className="h-4 w-4 text-[#059669]" />
                              <span className="truncate">{msg.media.name}</span>
                              {msg.media.sizeLabel && (
                                <span className="text-[#6B7280]">({msg.media.sizeLabel})</span>
                              )}
                            </a>
                          )}
                        </div>
                      )}

                      {attached && (
                        <button
                          type="button"
                          onClick={() => onOpenProduct(attached)}
                          className="mt-2 flex w-full items-center justify-between gap-2.5 rounded-xl border border-[#E5E7EB] bg-white p-2 text-start hover:border-[#059669]"
                        >
                          <div className="flex min-w-0 items-center gap-2.5">
                            <img
                              src={attached.image}
                              alt={lang === 'ar' ? attached.title : attached.titleEn}
                              referrerPolicy="no-referrer"
                              className="h-10 w-12 shrink-0 rounded object-cover"
                            />
                            <div className="min-w-0">
                              <div className="truncate text-xs font-bold text-[#141518]">
                                {lang === 'ar' ? attached.title : attached.titleEn}
                              </div>
                              <div className="font-mono-data text-xs font-semibold text-[#059669]">
                                ${attached.priceUSD.toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <span className="shrink-0 text-[11px] font-semibold text-[#059669]">
                            {t.common.viewDetails}
                          </span>
                        </button>
                      )}

                      {/* Compact Messenger Action Strip */}
                      <div className="mt-1.5 flex items-center justify-between gap-2 border-t border-black/5 pt-1 text-[11px] text-[#6B7280]">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onReactMessage(msg.id)}
                            aria-label="Like"
                            className="inline-flex h-7 items-center gap-1 rounded-md px-1.5 hover:bg-black/5 hover:text-[#059669]"
                          >
                            <ThumbsUp className="h-3.5 w-3.5" />
                            {msg.reactions > 0 && (
                              <span className="tabular-nums">{msg.reactions}</span>
                            )}
                          </button>
                          {canReply && (
                            <button
                              type="button"
                              onClick={() => setReplyingTo(msg)}
                              aria-label={lang === 'ar' ? 'رد' : 'Reply'}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-black/5 hover:text-[#141518]"
                            >
                              <Reply className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setForwardingMsg(msg)}
                            aria-label={lang === 'ar' ? 'تحويل' : 'Forward'}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-black/5 hover:text-[#141518]"
                          >
                            <Forward className="h-3.5 w-3.5" />
                          </button>
                          {isMe && !isEditing && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingMsgId(msg.id);
                                  setEditingDraft(msg.text);
                                }}
                                aria-label={t.common.edit}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-black/5 hover:text-[#059669]"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteMessage(msg.id)}
                                aria-label={t.common.delete}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-black/5 hover:text-[#DC2626]"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => onTogglePin(msg.id)}
                          aria-label="Pin message"
                          className={`inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-black/5 ${
                            msg.pinned ? 'text-[#059669]' : ''
                          }`}
                        >
                          <Pin className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Sticky Bottom Composer or Group Permission Lock Banner */}
            {!postCheck.allowed ? (
              <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-[#E5E7EB] bg-[#F8F9FA] px-4 py-3 text-xs">
                <div className="flex items-center gap-2 text-[#4B5563]">
                  <Lock className="h-4 w-4 shrink-0 text-[#B45309]" />
                  <span className="font-semibold">
                    {postCheck.reason === 'admins_only'
                      ? lang === 'ar'
                        ? 'النشر في هذه المجموعة مقتصر على المشرفين حالياً.'
                        : 'Only group administrators can send messages right now.'
                      : postCheck.reason === 'muted'
                      ? lang === 'ar'
                        ? 'تم كتم حسابك في هذه المجموعة.'
                        : 'You are muted in this group.'
                      : lang === 'ar'
                      ? 'الإرسال متاح للأعضاء المصرّح لهم فقط.'
                      : 'Only approved members can post in this group.'}
                  </span>
                </div>
                {activeThread.channelId && (
                  <button
                    type="button"
                    onClick={() => onOpenChannel(activeThread.channelId!)}
                    className="font-semibold text-[#059669] hover:underline whitespace-nowrap"
                  >
                    {lang === 'ar' ? 'تصفح القناة' : 'Browse Channel'}
                  </button>
                )}
              </div>
            ) : (
              <form
                onSubmit={handleSend}
                className="relative shrink-0 space-y-2 border-t border-[#E5E7EB] bg-white p-2.5 sm:p-3.5"
              >
                {replyingTo && (
                  <div className="flex items-center justify-between rounded-lg border border-[#E5E7EB] bg-[#F8F9FA] px-3 py-1.5 text-xs">
                    <div className="min-w-0">
                      <span className="font-bold text-[#059669]">{replyingTo.authorName}: </span>
                      <span className="truncate text-[#4B5563]">{replyingTo.text}</span>
                    </div>
                    <button type="button" onClick={() => setReplyingTo(null)} className="text-[#6B7280]">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {selectedProductObj && (
                  <div className="flex items-center justify-between rounded-lg border border-[#A7F3D0] bg-[#ECFDF5] px-3 py-1.5 text-xs text-[#065F46]">
                    <span className="truncate font-semibold">
                      {lang === 'ar' ? 'منتج مرفق:' : 'Attached:'}{' '}
                      {lang === 'ar' ? selectedProductObj.title : selectedProductObj.titleEn} ($
                      {selectedProductObj.priceUSD})
                    </span>
                    <button type="button" onClick={() => setAttachedProductId('')}>
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {pendingMedia && (
                  <div className="flex items-center justify-between rounded-lg border border-[#A7F3D0] bg-[#ECFDF5] px-3 py-1.5 text-xs text-[#065F46]">
                    <span className="truncate font-semibold">
                      {pendingMedia.name}
                      {pendingMedia.durationSec ? ` (${pendingMedia.durationSec}s)` : ''}
                    </span>
                    <button type="button" onClick={() => setPendingMedia(null)}>
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {voiceError && <p className="text-[11px] text-[#DC2626]">{voiceError}</p>}

                {/* Product Attachment Popover */}
                {productPickerOpen && canAttachProduct && (
                  <div className="absolute bottom-full start-3 end-3 z-30 mb-2 max-h-56 overflow-y-auto rounded-2xl border border-[#E5E7EB] bg-white p-2 shadow-xl sm:start-auto sm:w-80">
                    <div className="mb-1.5 flex items-center justify-between border-b border-[#F3F4F6] px-2 pb-1.5 text-xs font-bold text-[#141518]">
                      <span>{lang === 'ar' ? 'إرفاق منتج بالرسالة' : 'Attach a Product'}</span>
                      <button type="button" onClick={() => setProductPickerOpen(false)}>
                        <X className="h-3.5 w-3.5 text-[#6B7280]" />
                      </button>
                    </div>
                    <div className="divide-y divide-[#F3F4F6]">
                      {products.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setAttachedProductId(p.id);
                            setProductPickerOpen(false);
                          }}
                          className="flex w-full items-center gap-2.5 rounded-lg p-2 text-start text-xs hover:bg-[#F8F9FA]"
                        >
                          <img
                            src={p.image}
                            alt={lang === 'ar' ? p.title : p.titleEn}
                            referrerPolicy="no-referrer"
                            className="h-9 w-9 shrink-0 rounded object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-semibold text-[#141518]">
                              {lang === 'ar' ? p.title : p.titleEn}
                            </div>
                            <div className="font-mono-data text-[11px] text-[#059669]">
                              ${p.priceUSD.toLocaleString()}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-1.5">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                    onChange={handleFilePick}
                    className="hidden"
                  />

                  <button
                    type="button"
                    disabled={!canAttachMedia}
                    onClick={() => fileInputRef.current?.click()}
                    aria-label={lang === 'ar' ? 'إرفاق وسائط أو ملف' : 'Attach media or file'}
                    title={!canAttachMedia ? (lang === 'ar' ? 'مقفول من المشرفين' : 'Restricted by admins') : undefined}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#E5E7EB] text-[#4B5563] hover:border-[#059669] hover:text-[#141518] disabled:opacity-35"
                  >
                    <Paperclip className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    disabled={!canAttachProduct}
                    onClick={() => setProductPickerOpen((p) => !p)}
                    aria-label={lang === 'ar' ? 'إرفاق منتج' : 'Attach product'}
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors disabled:opacity-35 ${
                      productPickerOpen || attachedProductId
                        ? 'border-[#059669] bg-[#ECFDF5] text-[#059669]'
                        : 'border-[#E5E7EB] text-[#4B5563] hover:border-[#059669]'
                    }`}
                  >
                    <ShoppingBag className="h-4 w-4" />
                  </button>

                  <input
                    type="text"
                    value={msgText}
                    onChange={(e) => setMsgText(e.target.value)}
                    placeholder={lang === 'ar' ? 'اكتب رسالة...' : 'Write a message...'}
                    className="min-w-0 flex-1 rounded-xl border border-[#D1D5DB] bg-[#F8F9FA] px-3.5 py-2.5 text-xs text-[#141518] outline-none focus:border-[#059669] focus:bg-white"
                  />

                  {!msgText.trim() && !attachedProductId && !pendingMedia ? (
                    <button
                      type="button"
                      disabled={!canAttachMedia}
                      onClick={toggleVoiceRecording}
                      aria-label={recording ? 'Stop recording' : 'Record voice'}
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors disabled:opacity-35 ${
                        recording
                          ? 'border-[#DC2626] bg-[#FEF2F2] text-[#DC2626]'
                          : 'border-[#E5E7EB] bg-[#F8F9FA] text-[#4B5563] hover:border-[#059669]'
                      }`}
                    >
                      {recording ? <Square className="h-4 w-4 fill-current" /> : <Mic className="h-4 w-4" />}
                    </button>
                  ) : (
                    <button
                      type="submit"
                      aria-label={t.common.send}
                      className="flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#059669] px-3.5 text-xs font-semibold text-white hover:bg-[#047857]"
                    >
                      <Send className="h-4 w-4" />
                      <span className="hidden sm:inline">{t.common.send}</span>
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center p-10 text-xs text-[#6B7280] lg:col-span-8">
            {lang === 'ar' ? 'اختر محادثة للبدء' : 'Select a conversation'}
          </div>
        )}
      </div>

      {/* Forward Message Dialog */}
      {forwardingMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-xl">
            <div className="mb-3 flex items-center justify-between border-b border-[#E5E7EB] pb-2.5">
              <h3 className="font-display text-sm font-bold text-[#141518]">
                {lang === 'ar' ? 'تحويل الرسالة إلى' : 'Forward Message To'}
              </h3>
              <button type="button" onClick={() => setForwardingMsg(null)} className="text-[#6B7280]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-64 divide-y divide-[#F3F4F6] overflow-y-auto text-xs">
              {threads.map((target) => (
                <button
                  key={target.id}
                  type="button"
                  onClick={async () => {
                    await onSendMessage({
                      threadId: target.id,
                      text: forwardingMsg.text,
                      attachedProductId: forwardingMsg.attachedProductId,
                      forwardedFrom: forwardingMsg.authorName,
                      forwardedPost: forwardingMsg.forwardedPost,
                      media: forwardingMsg.media,
                    });
                    setForwardingMsg(null);
                    onSelectThread(target.id);
                    setMobileShowThread(true);
                  }}
                  className="flex w-full items-center gap-2.5 py-2.5 text-start hover:text-[#059669]"
                >
                  <img
                    src={target.avatar}
                    alt={lang === 'ar' ? target.title : target.titleEn}
                    referrerPolicy="no-referrer"
                    className="h-8 w-8 rounded-full object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-bold text-[#141518]">
                      {lang === 'ar' ? target.title : target.titleEn}
                    </div>
                    <div className="text-[11px] text-[#6B7280]">
                      {target.kind === 'group'
                        ? lang === 'ar'
                          ? 'مجموعة'
                          : 'Group'
                        : lang === 'ar'
                        ? 'محادثة خاصة'
                        : 'Private Chat'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
