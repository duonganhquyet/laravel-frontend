import { api } from '../lib/axios'; //[cite: 2]
import type { Conversation, ConversationParticipant } from '../types/conversation.type';

export const conversationApi = {
  // Lấy danh sách conversation của User hiện tại
  getConversations: () => api.get<Conversation[]>('/conversations'),
  
  // Tạo chat 1-1
  createDirectChat: (targetUserId:string) => 
    api.post<Conversation>('/conversations', { userId: targetUserId }),
    
  // Tạo chat nhóm
  createGroupChat: (chatName: string, userIds:string[]) => 
    api.post<Conversation>('/conversations/group', { name: chatName, users: userIds }),

  // Cập nhật tên nhóm, v.v.
  updateConversation: (id:string, data: Partial<Conversation>) => 
    api.put<Conversation>(`/conversations/${id}`, data),

  // Đánh dấu đã đọc tất cả tin nhắn trong conversation
  markAsRead: (conversationId: string) => 
    api.put<{ success: boolean }>(`/conversations/${conversationId}/read`),
};

export const participantApi = {
  // Lấy thành viên của nhóm
  getParticipants: (conversationId:string) => 
    api.get<ConversationParticipant[]>(`/conversations/${conversationId}/participants`),
    
  // Thêm thành viên vào nhóm
  addMember: (conversationId:string, userId:string) => 
    api.post<ConversationParticipant>(`/conversations/${conversationId}/participants`, { userId }),
    
  // Xóa thành viên (Admin xóa)
  removeMember: (conversationId:string, userId:string, removeByUserId:string) => 
    api.delete(`/conversations/${conversationId}/participants/${userId}`, { data: { removeBy: removeByUserId } }),
};

export const noteApi = {
  getNotes: (conversationId: string) => 
    api.get(`/conversations/${conversationId}/notes`),
  createNote: (conversationId: string, content: string) => 
    api.post(`/conversations/${conversationId}/notes`, { content }),
  updateNote: (noteId: string, content: string) => 
    api.put(`/notes/${noteId}`, { content }),
  deleteNote: (noteId: string) => 
    api.delete(`/notes/${noteId}`),
};

export const pollApi = {
  getPolls: (conversationId: string) => 
    api.get(`/conversations/${conversationId}/polls`),
  createPoll: (conversationId: string, question: string, options: string[]) => 
    api.post(`/conversations/${conversationId}/polls`, { question, options }),
  votePoll: (pollId: string, optionId: string) => 
    api.post(`/polls/${pollId}/vote`, { optionId }),
};