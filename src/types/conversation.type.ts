import type { User } from './user.type';
import type { Message } from './message.type';

export interface Conversation {
  _id: string;
  id: string | number;
  conversationId: string;        // Primary identifier used throughout the app
  chatName: string;
  isGroupChat: boolean;
  groupAdmins: string[];          // List of user IDs who are admins
  users: User[];
  latestMessage?: LatestMessage | null;
  otherUserId?: string | null;
  otherUserAvatar?: string | null;
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
  role: 'admin' | 'member';
}