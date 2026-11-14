import React from 'react';
import { ChatMessage, ChatThread, Language, MessageMediaAttachment, Product, StoreChannel } from '../types/commerce';
import { MessagingWorkspace } from './MessagingWorkspace';

interface ChatsPageProps {
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

export const ChatsPage: React.FC<ChatsPageProps> = (props) => {
  return <MessagingWorkspace {...props} />;
};
