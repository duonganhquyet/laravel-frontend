export interface Message {
  _id: string;            // Backend trả _id
  id?: string | number;
  conversationId: string;
  sender: {
    _id: string;
    fullName: string;
    avatar: string | null;
  } | null;
  content: string;
  messageType: 'text' | 'image' | 'video' | 'file' | 'system' | 'poll' | 'note';
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
  isDeletedForAll: boolean;
  replyToMessageId?: string | null;
  readBy: {
    _id: string;
    fullName: string;
    avatar: string | null;
  }[];
  createdAt: string;
  updatedAt: string;
}