import { api } from '../lib/axios';
import type { User } from '../types/user.type'; // Interface User đã định nghĩa ở bước trước

export const userApi = {
  // Lấy thông tin profile (Yêu cầu có Access Token trong Header)
  getProfile: () => 
    api.get<User>('/user/profile'), //[cite: 3]
};