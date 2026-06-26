import { api } from '../lib/axios';
import type { User } from '../types/user.type'; // Interface User đã định nghĩa ở bước trước

export const userApi = {
  // Lấy thông tin profile (Yêu cầu có Access Token trong Header)
  getProfile: () => 
    api.get<User>('/user/profile'), //[cite: 3]

  // Tìm kiếm người dùng theo tên hoặc email (Yêu cầu có Access Token)
  searchUsers: (query: string) => 
    api.get<User[]>(`/user/search?query=${encodeURIComponent(query)}`),

  // Cập nhật ảnh đại diện
  uploadAvatar: (formData: FormData) =>
    api.post('/users/upload-avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
};