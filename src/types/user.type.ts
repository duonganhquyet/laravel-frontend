export interface User {
  _id: string;         // Giữ _id để tương thích với backend response
  id: string | number;
  fullName: string;
  email: string;
  avatar: string | null;
  createdAt?: string;
  updatedAt?: string;
}