import React from 'react';
import {
  ChatMessage,
  ChatThread,
  ForwardedChannelPostSummary,
  GroupPermissions,
  Language,
  MessageMediaAttachment,
  Product,
  StoreChannel,
} from '../types/commerce';
import { MessagingWorkspace } from './MessagingWorkspace';

interface ChatsPageProps {
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

export const ChatsPage: React.FC<ChatsPageProps> = (props) => {
  return <MessagingWorkspace {...props} />;
};
