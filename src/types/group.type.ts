// src/types/group.type.ts

export interface PollOption {
  OptionId: number;
  PollId: number;
  OptionText: string;
  VoterIds: number[]; // Mảng chứa UserId của những người đã bình chọn
}

export interface Poll {
  PollId: number;
  ConversationId: number;
  Question: string;
  CreatedByUserId: number; // ID người tạo
  CreatedAt: string;
  IsActive: boolean;
  Options: PollOption[];
}

export interface GroupNote {
  NoteId: number;
  ConversationId: number;
  Content: string;
  CreatedByUserId: number;
  CreatedAt: string;
  UpdatedAt: string;
}