export interface Message {
  MessageId: number;
  ConversationId: number;
  SenderId: number;
  MessageType: string; // 'text', 'image', 'file'
  Content: string;
  FileName?: string;
  FileSize?: number;
  MimeType?: string;
  CreatedAt: string;
  UpdatedAt: string;
  ReplyToMessageId?: number;
  IsDeletedBySender: boolean;
  IsDeletedForAll: boolean;
  DeletedAt?: string;
}

export interface MessageRead {
  MessageId: number;
  UserId: number;
  ReadAt: string;
}