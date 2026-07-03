import type { Message } from '../types/message.type';

/**
 * Raw backend message object.
 */
export type BackendMessage = {
  _id?: string;
  id?: string | number;
  conversationId?: string;
  sender?: {
    _id?: string;
    id?: string | number;
    fullName?: string;
    avatar?: string | null;
  } | null;
  content?: string;
  messageType?: string;
  type?: string;
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
  isDeletedForAll?: boolean;
  replyToMessageId?: string | null;
  readBy?: Array<{ _id?: string; fullName?: string; avatar?: string | null }>;
  createdAt?: string;
  updatedAt?: string;
};

export const mapBackendMessage = (message: BackendMessage): Message => {
  return {
    _id:             message._id ?? String(message.id ?? ''),
    id:              message.id,
    conversationId:  message.conversationId ?? '',
    sender:          message.sender ? {
      _id:      message.sender._id ?? String(message.sender.id ?? ''),
      fullName: message.sender.fullName ?? '',
      avatar:   message.sender.avatar ?? null,
    } : null,
    content:         message.content ?? '',
    messageType:     (message.messageType ?? message.type ?? 'text') as Message['messageType'],
    fileUrl:         message.fileUrl ?? null,
    fileName:        message.fileName ?? null,
    fileSize:        message.fileSize ?? null,
    mimeType:        message.mimeType ?? null,
    isDeletedForAll: message.isDeletedForAll ?? false,
    replyToMessageId: message.replyToMessageId ?? null,
    readBy:          (message.readBy ?? []).map((r: any) => ({
      _id:      r._id ?? String(r.id ?? ''),
      fullName: r.fullName ?? '',
      avatar:   r.avatar ?? null,
    })),
    createdAt:  message.createdAt ?? new Date().toISOString(),
    updatedAt:  message.updatedAt ?? new Date().toISOString(),
  };
};

export const mapBackendMessages = (messages: BackendMessage[] = []): Message[] =>
  messages.map(mapBackendMessage);