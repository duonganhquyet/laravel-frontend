import { api } from '../lib/axios';
import type { Poll, GroupNote } from '../types/group.type';

export const mapNote = (backendNote: any): GroupNote => ({
  id: backendNote.id ?? backendNote.NoteId,
  conversationId: backendNote.conversation_id ?? backendNote.ConversationId,
  content: backendNote.content ?? backendNote.Content,
  createdByUserId: backendNote.user_id ?? backendNote.CreatedByUserId,
  createdAt: backendNote.created_at ?? backendNote.CreatedAt,
  updatedAt: backendNote.updated_at ?? backendNote.UpdatedAt,
});

export const mapPoll = (backendPoll: any): Poll => ({
  id: backendPoll.id ?? backendPoll.PollId,
  conversationId: backendPoll.conversation_id ?? backendPoll.ConversationId,
  question: backendPoll.question ?? backendPoll.Question,
  createdByUserId: backendPoll.user_id ?? backendPoll.CreatedByUserId,
  createdAt: backendPoll.created_at ?? backendPoll.CreatedAt,
  isActive: backendPoll.is_active ?? backendPoll.IsActive ?? true,
  options: (backendPoll.options ?? backendPoll.Options ?? []).map((o: any) => ({
    id: o.id ?? o.OptionId,
    pollId: o.poll_id ?? o.PollId,
    optionText: o.option_text ?? o.OptionText,
    voterIds: (o.votes ?? o.VoterIds ?? []).map((v: any) => v.user_id ?? v),
  })),
});

export const pollApi = {
  getPolls: (conversationId: string) => 
    api.get(`/conversations/${conversationId}/polls`),

  createPoll: (conversationId: string, question: string, options: string[]) => 
    api.post(`/conversations/${conversationId}/polls`, { question, options }),

  votePoll: (pollId: string, optionId: string) => 
    api.post(`/polls/${pollId}/vote`, { optionId }),
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