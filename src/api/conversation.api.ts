import { api } from '../lib/axios';
import type { ConversationParticipant } from '../types/conversation.type';

export const conversationApi = {
  // GET /conversations – danh sách cuộc trò chuyện
  getConversations: () =>
    api.get('/conversations'),

  // POST /conversations – tạo/truy cập chat 1-1
  createDirectChat: (targetUserId: string) =>
    api.post('/conversations', { userId: targetUserId }),

  // POST /conversations/group – tạo nhóm
  createGroupChat: (chatName: string, userIds: string[]) =>
    api.post('/conversations/group', { chatName, users: userIds }),

  // PUT /conversations/:id – đổi tên nhóm
  updateConversation: (id: string, data: { chatName: string }) =>
    api.put(`/conversations/${id}`, data),

  // DELETE /conversations/:conversationId – xóa lịch sử chat
  clearHistory: (conversationId: string) =>
    api.delete(`/conversations/${conversationId}`),

  // DELETE /conversations/:conversationId/leave – rời nhóm
  leaveGroup: (conversationId: string) =>
    api.delete(`/conversations/${conversationId}/leave`),

  // PUT /conversations/:conversationId/read – đánh dấu đã đọc
  markAsRead: (conversationId: string) =>
    api.put(`/conversations/${conversationId}/read`),
};

export const participantApi = {
  // GET /conversations/:conversationId/participants
  getParticipants: (conversationId: string) =>
    api.get<ConversationParticipant[]>(`/conversations/${conversationId}/participants`),

  // POST /conversations/:conversationId/participants
  addMember: (conversationId: string, userId: string) =>
    api.post(`/conversations/${conversationId}/participants`, { userId }),

  // DELETE /conversations/:conversationId/participants/:userId
  removeMember: (conversationId: string, userId: string) =>
    api.delete(`/conversations/${conversationId}/participants/${userId}`),

  // PUT /conversations/:conversationId/participants/:userId/admin
  grantAdmin: (conversationId: string, userId: string) =>
    api.put(`/conversations/${conversationId}/participants/${userId}/admin`),
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