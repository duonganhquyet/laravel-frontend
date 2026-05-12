import { api } from '../lib/axios'; //[cite: 2]
import type { Conversation, ConversationParticipant } from '../types/conversation.type';

export const conversationApi = {
  // Lấy danh sách conversation của User hiện tại
  getConversations: () => api.get<Conversation[]>('/conversations'),
  
  // Tạo chat 1-1
  createDirectChat: (targetUserId: number) => 
    api.post<Conversation>('/conversations/direct', { targetUserId }),
    
  // Tạo chat nhóm
  createGroupChat: (chatName: string, userIds: number[]) => 
    api.post<Conversation>('/conversations/group', { ChatName: chatName, UserIds: userIds }),

  // Cập nhật tên nhóm, v.v.
  updateConversation: (id: number, data: Partial<Conversation>) => 
    api.put<Conversation>(`/conversations/${id}`, data),
};

export const participantApi = {
  // Lấy thành viên của nhóm
  getParticipants: (conversationId: number) => 
    api.get<ConversationParticipant[]>(`/conversations/${conversationId}/participants`),
    
  // Thêm thành viên vào nhóm
  addMember: (conversationId: number, userId: number) => 
    api.post<ConversationParticipant>(`/conversations/${conversationId}/participants`, { UserId: userId }),
    
  // Xóa thành viên (Admin xóa)
  removeMember: (conversationId: number, userId: number, removeByUserId: number) => 
    api.delete(`/conversations/${conversationId}/participants/${userId}`, { data: { RemoveBy: removeByUserId } }),
};