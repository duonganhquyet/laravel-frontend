import { api } from '../lib/axios';

export const searchApi = {
  // GET /search?q=keyword
  searchUsers: (keyword: string) => api.get('/search', { params: { q: keyword } }),
};