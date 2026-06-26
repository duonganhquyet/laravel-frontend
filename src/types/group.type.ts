// src/types/group.type.ts

export interface PollOption {
  OptionId: string;
  PollId: string;
  OptionText: string;
  VoterIds: string[]; // Mảng chứa UserId của những người đã bình chọn
}

export interface Poll {
  PollId: string;
  ConversationId: string;
  Question: string;
  CreatedByUserId: string; // ID người tạo
  CreatedAt: string;
  IsActive: boolean;
  Options: PollOption[];
}

export interface GroupNote {
  NoteId: string;
  ConversationId: string;
  Content: string;
  CreatedByUserId: string;
  CreatedAt: string;
  UpdatedAt: string;
}