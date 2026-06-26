import type { Message } from '../types/message.type';

export type BackendSender = {
  _id?: string;
  fullName?: string;
  avatar?: string | null;
};

export type BackendMessage = {
  _id?: string;
  conversationId?: string;
  senderId?: string | BackendSender;
  sender?: string | BackendSender;
  content?: string;
  type?: string;
  messageType?: string;
  createdAt?: string;
  updatedAt?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  replyToMessageId?: string;
  isDeletedBySender?: boolean;
  isDeletedForAll?: boolean;
  deletedAt?: string;
  readBy?: BackendSender[] | string[];
};

const getSenderId = (sender: BackendMessage['senderId'] | BackendMessage['sender']) => {
  if (typeof sender === 'string') return sender;
  return sender?._id || '';
};

const getSender = (sender: BackendMessage['senderId'] | BackendMessage['sender']): { _id: string; fullName: string; avatar: string | null } | undefined => {
  if (typeof sender === 'object' && sender?._id) {
    return {
      _id: sender._id,
      fullName: sender.fullName || '',
      avatar: sender.avatar || null,
    };
  }
  return undefined;
};

export const mapBackendMessage = (message: BackendMessage): Message => ({
  MessageId: message._id || '',
  ConversationId: message.conversationId || '',
  SenderId: getSenderId(message.sender || message.senderId),
  Sender: getSender(message.sender || message.senderId),
  MessageType: message.messageType || message.type || 'text',
  Content: message.content || '',
  FileUrl: message.fileUrl,
  FileName: message.fileName,
  FileSize: message.fileSize,
  MimeType: message.mimeType,
  CreatedAt: message.createdAt || new Date().toISOString(),
  UpdatedAt: message.updatedAt || new Date().toISOString(),
  ReplyToMessageId: message.replyToMessageId,
  IsDeletedBySender: message.isDeletedBySender ?? false,
  IsDeletedForAll: message.isDeletedForAll ?? false,
  DeletedAt: message.deletedAt,
  ReadBy: (message.readBy || []).map((r: any) => {
    if (typeof r === 'string') return { _id: r, fullName: '', avatar: null };
    return {
      _id: r._id || '',
      fullName: r.fullName || '',
      avatar: r.avatar || null,
    };
  }),
});

export const mapBackendMessages = (messages: BackendMessage[] = []): Message[] =>
  messages.map(mapBackendMessage);