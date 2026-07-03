import { api } from '../lib/axios';


export const userApi = {
  // GET /users/profile
  getProfile: () => api.get('/users/profile'),

  // GET /users/:id
  getUserById: (id: string | number) => api.get(`/users/${id}`),

  // PUT /users/avatar – upload avatar (field: file, max 10MB)
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('_method', 'PUT');
    return api.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};