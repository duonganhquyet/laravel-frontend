export interface PollOption {
  id: string | number;
  pollId: string | number;
  optionText: string;
  voterIds: (string | number)[];
}

export interface Poll {
  id: string | number;
  conversationId: string | number;
  question: string;
  createdByUserId: string | number;
  createdAt: string;
  isActive: boolean;
  options: PollOption[];
}

export interface GroupNote {
  id: string | number;
  conversationId: string | number;
  content: string;
  createdByUserId: string | number;
  createdAt: string;
  updatedAt: string;
  creatorName?: string;
  creatorAvatar?: string | null;
}