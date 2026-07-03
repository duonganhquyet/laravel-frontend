import type { User } from './user.type';
import type { Message } from './message.type';

export interface Conversation {
  _id: string;
  id: string | number;
  conversationId: string;        // Primary identifier used throughout the app
  chatName: string;
  isGroupChat: boolean;
  groupAdmins: string[];          // List of user IDs who are admins (is_admin=true)
  creatorId?: string | null;      // The creator/owner (ADMIN rank)
  users: User[];
  latestMessage?: LatestMessage | null;
  otherUserId?: string | null;
  otherUserAvatar?: string | null;
  unreadCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface LatestMessage {
  _id: string;
  content: string;
  messageType: string;
  sender?: { _id: string; fullName: string; avatar?: string | null } | null;
  createdAt: string;
}

export interface ConversationParticipant {
  userId: string;
  fullName: string;
  email: string;
  avatar: string | null;
  role: 'creator' | 'admin' | 'member';
}