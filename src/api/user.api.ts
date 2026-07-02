import { api } from '../lib/axios';
import type { User } from '../types/user.type';

export const userApi = {
  // GET /users/profile
  getProfile: () => api.get('/users/profile'),

  // GET /users/:id
  getUserById: (id: string | number) => api.get(`/users/${id}`),

  // PUT /users/avatar – upload avatar (field: file, max 10MB)
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.put('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};