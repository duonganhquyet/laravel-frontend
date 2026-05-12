export interface User {
  UserId: number;
  FullName: string;
  Email: string;
  // Bỏ qua PasswordHash ở Frontend vì lý do bảo mật
  Avatar: string;
  IsOnline: boolean;
  LastActive: string; // datetime (ISO string)
  Role: string; // enum
  IsActive: boolean;
  CreateAt: string;
  UpdatedAt: string;
}