export interface SearchHistory {
  SearchId: number;
  UserId: number;
  SearchQuery: string;
  ClickedUserId?: number;
  CreateAt: string;
  SearchScope: string; // enum
  ConversationId?: number;
}