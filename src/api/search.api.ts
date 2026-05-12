import { api } from '../lib/axios'; //[cite: 2]
import type { SearchHistory } from '../types/search.type';

export const searchApi = {
  // Lưu lịch sử tìm kiếm theo Class SearchHistories
  saveSearchHistory: (data: Partial<SearchHistory>) => 
    api.post<SearchHistory>('/search-history', data),
  
  getSearchHistories: () => api.get<SearchHistory[]>('/search-history'),
};