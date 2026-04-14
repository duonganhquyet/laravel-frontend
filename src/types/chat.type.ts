import type { User } from "./user.type";

export interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: "text" | "image" | "file";
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  _id: string;
  type: "private" | "group";
  members: User[];
  lastMessage?: Message;
  createdAt: string;
  updatedAt: string;
}