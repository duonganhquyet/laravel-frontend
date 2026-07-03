import type { Conversation } from '../types/conversation.type';

/**
 * Raw backend conversation response shape.
 */
export interface BackendConversation {
  _id?: string;
  id?: string | number;
  conversationId?: string;
  chatName?: string;
  isGroupChat?: boolean;
  groupAdmins?: string[];
  users?: any[];
  latestMessage?: any;
  otherUserId?: string | null;
  otherUserAvatar?: string | null;
  unreadCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export const mapBackendConversation = (be: BackendConversation): Conversation => {
  const id = be.conversationId ?? be._id ?? String(be.id) ?? '';

  return {
    _id:             be._id ?? id,
    id:              be.id ?? id,
    conversationId:  id,
    chatName:        be.chatName ?? '',
    isGroupChat:     be.isGroupChat ?? false,
    groupAdmins:     be.groupAdmins ?? [],
    users:           (be.users ?? []).map((u: any) => ({
      _id:      u._id ?? String(u.id),
      id:       u.id,
      fullName: u.fullName ?? u.full_name ?? '',
      email:    u.email ?? '',
      avatar:   u.avatar ?? null,
    })),
    latestMessage:   be.latestMessage ?? null,
    otherUserId:     be.otherUserId ?? null,
    otherUserAvatar: be.otherUserAvatar ?? null,
    unreadCount:     be.unreadCount ?? 0,
    createdAt:       be.createdAt,
    updatedAt:       be.updatedAt,
  };
};

export const mapBackendConversations = (beArray: BackendConversation[]): Conversation[] => {
  if (!Array.isArray(beArray)) return [];
  return beArray.map(mapBackendConversation);
};
