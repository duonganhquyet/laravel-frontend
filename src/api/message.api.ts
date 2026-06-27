import { api } from '../lib/axios'; //[cite: 2]
import type { Message, MessageRead } from '../types/message.type';
import type { BackendMessage } from '../lib/messageMapper';

interface MessageHistoryResponse {
  messages: BackendMessage[];
  currentPage: number;
  totalPages: number;
  totalMessages: number;
}

export const messageApi = {
  // Lấy lịch sử tin nhắn của một conversation
  getMessages: (conversationId: string) => 
    api.get<{ data: MessageHistoryResponse }>(`/messages/${conversationId}`),

  // Gửi tin nhắn (Hỗ trợ file đính kèm dựa trên MessageType)
  sendMessage: (conversationId: string, content: string, file?: File) => {
    const formData = new FormData();
    formData.append('conversationId', conversationId.toString());
    formData.append('content', content);
    if (file) {
      formData.append('file', file); // Sẽ xử lý để lấy FileName, FileSize, MimeType tại backend
    }
    return api.post<BackendMessage>('/messages', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // Đánh dấu đã đọc tin nhắn
  markAsRead: (messageId: string) => 
    api.post<MessageRead>(`/messages/${messageId}/read`),

  // Tìm kiếm tin nhắn, ảnh, file
  searchMessages: (conversationId: string, query: string, type?: string) => 
    api.get<Message[]>(`/messages/search`, { 
      params: { conversationId: conversationId, keyword: query, MessageType: type } 
    }),

  editMessage: (messageId: string, content: string) =>
    api.put<{ data: BackendMessage }>(`/messages/${messageId}`, { content }),

  recallMessage: (messageId: string) =>
    api.delete<{ data: BackendMessage }>(`/messages/${messageId}`),
};