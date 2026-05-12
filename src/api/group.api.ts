// src/api/group.api.ts
import { api } from '../lib/axios';
import type { Poll, GroupNote } from '../types/group.type';

export const pollApi = {
  // Lấy danh sách bình chọn trong nhóm
  getPolls: (conversationId: number) => 
    api.get<Poll[]>(`/conversations/${conversationId}/polls`),

  // Tạo bình chọn mới
  createPoll: (conversationId: number, question: string, options: string[]) => 
    api.post<Poll>(`/conversations/${conversationId}/polls`, { 
      Question: question, 
      Options: options 
    }),

  // Bấm bình chọn (truyền vào OptionId được chọn)
  votePoll: (pollId: number, optionId: number) => 
    api.post(`/polls/${pollId}/vote`, { OptionId: optionId }),
};

export const noteApi = {
  // Lấy danh sách ghi chú
  getNotes: (conversationId: number) => 
    api.get<GroupNote[]>(`/conversations/${conversationId}/notes`),

  // Tạo ghi chú mới
  createNote: (conversationId: number, content: string) => 
    api.post<GroupNote>(`/conversations/${conversationId}/notes`, { Content: content }),

  // Cập nhật ghi chú
  updateNote: (noteId: number, content: string) => 
    api.put<GroupNote>(`/notes/${noteId}`, { Content: content }),

  // Xóa ghi chú (có thể cần check quyền trên backend)
  deleteNote: (noteId: number) => 
    api.delete(`/notes/${noteId}`),
};