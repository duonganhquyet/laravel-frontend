export interface Message {
  MessageId: string;
  ConversationId: string;
  SenderId: string;
  Sender?: {
    _id: string;
    fullName: string;
    avatar: string | null;
  };
  MessageType: string; // 'text', 'image', 'video', 'file'
  Content: string;
  FileUrl?: string;
  FileName?: string;
  FileSize?: number;
  MimeType?: string;
  CreatedAt: string;
  UpdatedAt: string;
  ReplyToMessageId?: string;
  IsDeletedBySender: boolean;
  IsDeletedForAll: boolean;
  DeletedAt?: string;
  ReadBy?: {
    _id: string;
    fullName: string;
    avatar: string | null;
  }[];
}

export interface MessageRead {
  MessageId: string;
  UserId: string;
  ReadAt: string;
}