export interface Conversation {
  ConversationId: number;
  ChatName: string;
  IsGroupChat: boolean;
  GroupAdminId?: number; // Nullable cho chat 1-1
  LatestMessageId?: number;
  CreateAt: string;
  UpdatedAt: string;
  IsActive: boolean;
}

export interface ConversationParticipant {
  ConversationId: number;
  UserId: number;
  JoinedAt: string;
  Role: string; // enum (vd: 'admin', 'member')
  IsActive: boolean;
  LeftAt?: string;
  RemoveBy?: number; // Người thực hiện xóa
}