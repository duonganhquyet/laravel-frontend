import { api } from '../lib/axios'; //[cite: 2]
import type { Message, MessageRead } from '../types/message.type';

export const messageApi = {
  // Lấy lịch sử tin nhắn của một conversation
  getMessages: (conversationId: number) => 
    api.get<Message[]>(`/messages/conversation/${conversationId}`),

  // Gửi tin nhắn (Hỗ trợ file đính kèm dựa trên MessageType)
  sendMessage: (conversationId: number, content: string, file?: File) => {
    const formData = new FormData();
    formData.append('ConversationId', conversationId.toString());
    formData.append('Content', content);
    if (file) {
      formData.append('file', file); // Sẽ xử lý để lấy FileName, FileSize, MimeType tại backend
    }
    return api.post<Message>('/messages', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // Đánh dấu đã đọc tin nhắn
  markAsRead: (messageId: number) => 
    api.post<MessageRead>(`/messages/${messageId}/read`),

  // Tìm kiếm tin nhắn, ảnh, file
  searchMessages: (conversationId: number, query: string, type?: string) => 
    api.get<Message[]>(`/messages/search`, { 
      params: { ConversationId: conversationId, keyword: query, MessageType: type } 
    }),
};