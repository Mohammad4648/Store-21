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
  Image as ImageIcon,
  MessageCircle,
  Mic,
  Paperclip,
  Pin,
  Reply,
  Search,
  Send,
  Square,
  Store,
  ThumbsUp,
  Trash2,
  Users,
  Video,
  X,
} from 'lucide-react';
import { UI_COPY } from '../i18n/translations';
import {
  ChatMessage,
  ChatThread,
  Language,
  MessageMediaAttachment,
  Product,
  StoreChannel,
} from '../types/commerce';
import { ChatKindFilter, filterChatThreads, filterMessagesInThread } from '../utils/commerceLogic';

interface MessagingWorkspaceProps {
  lang: Language;
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
    media?: MessageMediaAttachment;
  }) => void;
  onEditMessage: (msgId: string, nextText: string) => Promise<void>;
  onDeleteMessage: (msgId: string) => Promise<void>;
  onReactMessage: (msgId: string) => void;
  onTogglePin: (msgId: string) => void;
  onOpenProduct: (product: Product) => void;
  onOpenChannel: (channelId: string) => void;
}

export const MessagingWorkspace: React.FC<MessagingWorkspaceProps> = ({
  lang,
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
}) => {
  const t = UI_COPY[lang];
  const [kindFilter, setKindFilter] = useState<ChatKindFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [inChatSearchOpen, setInChatSearchOpen] = useState(false);
  const [inChatSearch, setInChatSearch] = useState('');
  const [msgText, setMsgText] = useState('');
  const [attachedProductId, setAttachedProductId] = useState('');
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

  const BackIcon = lang === 'ar' ? ArrowRight : ArrowLeft;

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

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThread) return;
    if (!msgText.trim() && !attachedProductId && !pendingMedia) return;

    onSendMessage({
      threadId: activeThread.id,
      text: msgText.trim(),
      attachedProductId: attachedProductId || undefined,
      replyTo: replyingTo
        ? {
            id: replyingTo.id,
            authorName: replyingTo.authorName,
            text: replyingTo.text.slice(0, 80),
          }
        : undefined,
      media: pendingMedia || undefined,
    });

    setMsgText('');
    setAttachedProductId('');
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

  return (
    <section className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white">
      <div className="grid min-h-[660px] grid-cols-1 lg:grid-cols-12">
        {/* Conversation List Sidebar */}
        <aside
          className={`flex flex-col border-b border-[#E5E7EB] bg-[#F8F9FA] lg:col-span-4 lg:border-b-0 lg:border-e ${
            mobileShowThread ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <div className="space-y-3 border-b border-[#E5E7EB] p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-[#059669]" />
                <h1 className="font-display text-base font-extrabold text-[#141518]">
                  {t.nav.chats}
                </h1>
              </div>
              <span className="font-mono-data text-xs text-[#6B7280]">{threads.length}</span>
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6B7280]" />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={
                  lang === 'ar'
                    ? 'ابحث في المحادثات والمجموعات...'
                    : 'Search private & group chats...'
                }
                className="w-full rounded-lg border border-[#D1D5DB] bg-white py-2 ps-8 pe-3 text-xs text-[#141518] outline-none focus:border-[#059669]"
              />
            </div>

            {/* Unified All / Private / Groups Filter */}
            <div
              role="group"
              aria-label={lang === 'ar' ? 'تصفية المحادثات' : 'Filter conversations'}
              className="grid grid-cols-3 gap-1 rounded-lg border border-[#E5E7EB] bg-white p-1 text-[11px] font-semibold"
            >
              {(
                [
                  { id: 'all', ar: 'الكل', en: 'All' },
                  { id: 'direct', ar: 'الخاصة', en: 'Private' },
                  { id: 'group', ar: 'المجموعات', en: 'Groups' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setKindFilter(tab.id)}
                  className={`rounded-md py-1.5 transition-colors whitespace-nowrap ${
                    kindFilter === tab.id
                      ? 'bg-[#059669] text-white'
                      : 'text-[#6B7280] hover:text-[#141518]'
                  }`}
                >
                  {lang === 'ar' ? tab.ar : tab.en}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 divide-y divide-[#E5E7EB] overflow-y-auto">
            {filteredThreads.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#6B7280]">
                {lang === 'ar' ? 'لا توجد محادثات مطابقة.' : 'No matching conversations.'}
              </div>
            ) : (
              filteredThreads.map((thr) => {
                const selected = activeThread?.id === thr.id;
                const lastThreadMsg = [...messages].reverse().find((m) => m.threadId === thr.id);
                return (
                  <button
                    key={thr.id}
                    type="button"
                    onClick={() => {
                      onSelectThread(thr.id);
                      setMobileShowThread(true);
                    }}
                    className={`flex w-full items-center gap-3 p-3.5 text-start transition-colors ${
                      selected ? 'bg-white shadow-2xs' : 'hover:bg-white/70'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={thr.avatar}
                        alt={lang === 'ar' ? thr.title : thr.titleEn}
                        referrerPolicy="no-referrer"
                        className="h-11 w-11 rounded-full border border-[#E5E7EB] object-cover"
                      />
                      {thr.kind === 'direct' && thr.online && (
                        <span
                          aria-label="Online"
                          className="absolute bottom-0 end-0 h-3 w-3 rounded-full border-2 border-white bg-[#10B981]"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-1">
                          <span className="truncate text-xs font-bold text-[#141518]">
                            {lang === 'ar' ? thr.title : thr.titleEn}
                          </span>
                          {thr.verified && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#059669]" />}
                        </div>
                        <span className="shrink-0 text-[10px] text-[#9CA3AF] tabular-nums">
                          {lastThreadMsg?.timestamp || (thr.kind === 'group' ? (lang === 'ar' ? 'مجموعة' : 'Group') : '')}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center justify-between gap-2">
                        <p className="truncate text-[11px] text-[#6B7280]">
                          {lastThreadMsg?.text || (lang === 'ar' ? thr.subtitle : thr.subtitleEn)}
                        </p>
                        {thr.unreadCount > 0 && (
                          <span className="shrink-0 rounded-full bg-[#059669] px-1.5 py-0.5 font-mono-data text-[10px] font-bold text-white">
                            {thr.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Active Conversation Pane */}
        {activeThread ? (
          <div
            className={`flex flex-col bg-white lg:col-span-8 ${
              mobileShowThread ? 'flex' : 'hidden lg:flex'
            }`}
          >
            {/* Conversation Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] px-4 py-3.5 sm:px-5">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileShowThread(false)}
                  aria-label="Back to list"
                  className="rounded-lg p-1.5 text-[#4B5563] hover:bg-[#F3F4F6] lg:hidden"
                >
                  <BackIcon className="h-4 w-4" />
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
                  <div className="flex items-center gap-1.5">
                    <h2 className="truncate font-display text-sm font-bold text-[#141518]">
                      {lang === 'ar' ? activeThread.title : activeThread.titleEn}
                    </h2>
                    {activeThread.verified && <CheckCircle2 className="h-4 w-4 shrink-0 text-[#059669]" />}
                  </div>
                  <p className="truncate text-xs text-[#6B7280]">
                    {activeThread.kind === 'group' && activeThread.membersCount
                      ? `${activeThread.membersCount.toLocaleString()} ${lang === 'ar' ? 'عضو في المجموعة' : 'group members'}`
                      : activeThread.lastSeen
                      ? lang === 'ar'
                        ? activeThread.lastSeen
                        : activeThread.lastSeenEn
                      : lang === 'ar'
                      ? activeThread.subtitle
                      : activeThread.subtitleEn}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setInChatSearchOpen((prev) => !prev);
                    setInChatSearch('');
                  }}
                  aria-label={lang === 'ar' ? 'بحث داخل المحادثة' : 'Search inside chat'}
                  className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                    inChatSearchOpen
                      ? 'border-[#059669] bg-[#ECFDF5] text-[#059669]'
                      : 'border-[#E5E7EB] bg-[#F8F9FA] text-[#141518] hover:border-[#059669]'
                  }`}
                >
                  <Search className="h-3.5 w-3.5" />
                </button>
                {activeThread.kind === 'group' && (
                  <button
                    type="button"
                    onClick={() => setGroupInfoOpen((p) => !p)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-[#F8F9FA] px-3 py-1.5 text-xs font-semibold text-[#141518] hover:border-[#059669] whitespace-nowrap"
                  >
                    <Users className="h-3.5 w-3.5 text-[#059669]" />
                    <span>{lang === 'ar' ? 'الأعضاء' : 'Members'}</span>
                  </button>
                )}
                {activeThread.channelId && (
                  <button
                    type="button"
                    onClick={() => onOpenChannel(activeThread.channelId!)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-[#F8F9FA] px-3 py-1.5 text-xs font-semibold text-[#141518] hover:border-[#059669] whitespace-nowrap"
                  >
                    <Store className="h-3.5 w-3.5 text-[#059669]" />
                    <span>{lang === 'ar' ? 'القناة' : 'Channel'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* In-conversation Search Input */}
            {inChatSearchOpen && (
              <div className="flex items-center gap-2 border-b border-[#E5E7EB] bg-[#F8F9FA] px-4 py-2 sm:px-5">
                <Search className="h-3.5 w-3.5 text-[#6B7280]" />
                <input
                  type="search"
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

            {/* Optional Group Member Information Drawer */}
            {activeThread.kind === 'group' && groupInfoOpen && linkedChannel && (
              <div className="border-b border-[#E5E7EB] bg-[#F8F9FA] px-5 py-3 text-xs">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-bold text-[#141518]">
                    {lang === 'ar' ? 'أعضاء المجموعة' : 'Group Members'} ({linkedChannel.members.length})
                  </span>
                  <button type="button" onClick={() => setGroupInfoOpen(false)} className="text-[#6B7280]">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {linkedChannel.members.map((m) => (
                    <div key={m.id} className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5">
                      <span className="font-semibold text-[#141518]">{m.name}</span>{' '}
                      <span className="text-[#6B7280]">· {m.role}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pinned Message Banner */}
            {(() => {
              const pinnedMsg = threadMessages.find((m) => m.pinned);
              if (!pinnedMsg) return null;
              return (
                <div className="flex items-center justify-between gap-3 border-b border-[#E5E7EB] bg-[#ECFDF5]/60 px-4 py-2 text-xs sm:px-5">
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
            <div className="max-h-[470px] flex-1 space-y-3 overflow-y-auto bg-[#F4F5F7] p-4 sm:p-5">
              {threadMessages.length === 0 ? (
                <div className="flex h-52 items-center justify-center text-xs text-[#6B7280]">
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

                  return (
                    <div
                      key={msg.id}
                      className={`group max-w-xl rounded-2xl border p-3.5 shadow-2xs transition-colors ${
                        isMe
                          ? 'ms-auto rounded-te-xs border-[#A7F3D0] bg-[#ECFDF5]'
                          : 'rounded-ts-xs border-[#E5E7EB] bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 text-[11px] text-[#6B7280]">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[#141518]">{msg.authorName}</span>
                          {msg.authorRole === 'seller' && (
                            <span className="font-semibold text-[#059669]">
                              · {lang === 'ar' ? 'بائع' : 'Seller'}
                            </span>
                          )}
                          {msg.forwardedFrom && (
                            <span className="italic text-[#6B7280]">
                              · {lang === 'ar' ? `محوّلة من ${msg.forwardedFrom}` : `Forwarded from ${msg.forwardedFrom}`}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 tabular-nums">
                          {msg.edited && (
                            <span className="text-[10px] italic text-[#6B7280]">
                              {lang === 'ar' ? 'معدّلة' : 'edited'}
                            </span>
                          )}
                          <span>{msg.timestamp}</span>
                          {isMe && (
                            msg.deliveryStatus === 'sent' ? (
                              <Check className="h-3 w-3 text-[#6B7280]" />
                            ) : (
                              <CheckCheck
                                className={`h-3.5 w-3.5 ${
                                  msg.deliveryStatus === 'read' ? 'text-[#059669]' : 'text-[#6B7280]'
                                }`}
                              />
                            )
                          )}
                        </div>
                      </div>

                      {msg.replyTo && (
                        <div className="mt-2 rounded-lg border border-[#E5E7EB] bg-white/80 px-3 py-1.5 text-[11px]">
                          <div className="font-bold text-[#059669]">{msg.replyTo.authorName}</div>
                          <div className="truncate text-[#4B5563]">{msg.replyTo.text}</div>
                        </div>
                      )}

                      {isEditing ? (
                        <form onSubmit={(e) => handleSaveEdit(e, msg.id)} className="mt-2 flex items-center gap-2">
                          <input
                            type="text"
                            value={editingDraft}
                            onChange={(e) => setEditingDraft(e.target.value)}
                            className="flex-1 rounded-lg border border-[#059669] bg-white px-2.5 py-1.5 text-xs text-[#141518] outline-none"
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
                          <p className="mt-1.5 text-sm leading-relaxed text-[#1F2937]">{msg.text}</p>
                        )
                      )}

                      {msg.media && (
                        <div className="mt-2.5 overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
                          {msg.media.kind === 'image' && (
                            <img
                              src={msg.media.url}
                              alt={msg.media.name}
                              className="max-h-60 w-full object-cover"
                            />
                          )}
                          {msg.media.kind === 'video' && (
                            <video src={msg.media.url} controls className="max-h-60 w-full" />
                          )}
                          {msg.media.kind === 'audio' && (
                            <div className="flex items-center gap-2 p-2.5">
                              <audio src={msg.media.url} controls className="h-8 w-full" />
                            </div>
                          )}
                          {msg.media.kind === 'file' && (
                            <a
                              href={msg.media.url}
                              download={msg.media.name}
                              className="flex items-center gap-2 p-3 text-xs font-semibold text-[#141518] hover:text-[#059669]"
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
                          className="mt-2.5 flex w-full items-center justify-between gap-3 rounded-xl border border-[#E5E7EB] bg-white p-2.5 text-start hover:border-[#059669]"
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
                              <div className="font-mono-data text-xs text-[#059669]">
                                ${attached.priceUSD.toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <span className="shrink-0 text-xs font-semibold text-[#059669]">
                            {t.common.viewDetails}
                          </span>
                        </button>
                      )}

                      {/* Message Actions */}
                      <div className="mt-2.5 flex items-center justify-between gap-3 text-[11px] text-[#6B7280]">
                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            onClick={() => onReactMessage(msg.id)}
                            className="inline-flex items-center gap-1 hover:text-[#059669]"
                          >
                            <ThumbsUp className="h-3.5 w-3.5" />
                            <span className="tabular-nums">{msg.reactions}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setReplyingTo(msg)}
                            className="inline-flex items-center gap-1 hover:text-[#141518]"
                          >
                            <Reply className="h-3.5 w-3.5" />
                            <span>{lang === 'ar' ? 'رد' : 'Reply'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setForwardingMsg(msg)}
                            className="inline-flex items-center gap-1 hover:text-[#141518]"
                          >
                            <Forward className="h-3.5 w-3.5" />
                            <span>{lang === 'ar' ? 'تحويل' : 'Forward'}</span>
                          </button>
                          {isMe && !isEditing && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingMsgId(msg.id);
                                  setEditingDraft(msg.text);
                                }}
                                className="inline-flex items-center gap-1 hover:text-[#059669]"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                                <span>{t.common.edit}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteMessage(msg.id)}
                                className="inline-flex items-center gap-1 hover:text-[#DC2626]"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>{t.common.delete}</span>
                              </button>
                            </>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => onTogglePin(msg.id)}
                          aria-label="Pin message"
                          className={msg.pinned ? 'font-semibold text-[#059669]' : 'hover:text-[#141518]'}
                        >
                          <Pin className="inline h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Composer */}
            <form onSubmit={handleSend} className="space-y-2 border-t border-[#E5E7EB] bg-white p-4">
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

              <div className="flex flex-wrap items-center justify-between gap-2">
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
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Attach image, video, or file"
                    className="inline-flex items-center gap-1 rounded-lg border border-[#E5E7EB] px-2.5 py-1 text-xs font-medium text-[#4B5563] hover:border-[#059669] hover:text-[#141518]"
                  >
                    <Paperclip className="h-3.5 w-3.5" />
                    <ImageIcon className="h-3.5 w-3.5" />
                    <Video className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={toggleVoiceRecording}
                    className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold ${
                      recording
                        ? 'border-[#DC2626] bg-[#FEF2F2] text-[#DC2626]'
                        : 'border-[#E5E7EB] text-[#4B5563] hover:border-[#059669]'
                    }`}
                  >
                    {recording ? <Square className="h-3 w-3 fill-current" /> : <Mic className="h-3.5 w-3.5" />}
                    <span>
                      {recording
                        ? lang === 'ar'
                          ? 'إيقاف'
                          : 'Stop'
                        : lang === 'ar'
                        ? 'صوت'
                        : 'Voice'}
                    </span>
                  </button>
                </div>

                <select
                  value={attachedProductId}
                  onChange={(e) => setAttachedProductId(e.target.value)}
                  className="rounded-lg border border-[#D1D5DB] bg-white px-2.5 py-1 text-xs text-[#141518]"
                >
                  <option value="">
                    {lang === 'ar' ? 'إرفاق منتج...' : 'Attach product...'}
                  </option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {lang === 'ar' ? p.title : p.titleEn}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={msgText}
                  onChange={(e) => setMsgText(e.target.value)}
                  placeholder={lang === 'ar' ? 'اكتب رسالة...' : 'Write a message...'}
                  className="flex-1 rounded-xl border border-[#D1D5DB] bg-[#F8F9FA] px-3.5 py-2 text-xs text-[#141518] outline-none focus:border-[#059669] focus:bg-white"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#059669] px-4 py-2 text-xs font-semibold text-white hover:bg-[#047857]"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{t.common.send}</span>
                </button>
              </div>
            </form>
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
                  onClick={() => {
                    onSendMessage({
                      threadId: target.id,
                      text: forwardingMsg.text,
                      attachedProductId: forwardingMsg.attachedProductId,
                      forwardedFrom: forwardingMsg.authorName,
                      media: forwardingMsg.media,
                    });
                    setForwardingMsg(null);
                    onSelectThread(target.id);
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
