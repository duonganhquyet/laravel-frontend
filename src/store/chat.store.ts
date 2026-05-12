import { create } from 'zustand';
import type { Conversation } from '../types/conversation.type';
import type { Message } from '../types/message.type';

interface ChatState {
  chats: Conversation[];
  currentChat: Conversation | null;
  messages: Message[];

  setChats: (chats: Conversation[]) => void;
  setCurrentChat: (chat: Conversation) => void;
  setMessages: (messages: Message[]) => void;
  prependMessages: (messages: Message[]) => void;
  addMessage: (msg: Message) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  chats: [],
  currentChat: null,
  messages: [],

  setChats: (chats) => set({ chats }),
  setCurrentChat: (chat) => set({ currentChat: chat }),
  setMessages: (messages) => set({ messages }),
  prependMessages: (oldMessages) =>
    set((state) => ({ messages: [...oldMessages, ...state.messages] })),
  addMessage: (msg) =>
    set((state) => ({
      messages: [...state.messages, msg],
    })),
}));