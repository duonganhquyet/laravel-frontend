import { api } from '../lib/axios';

// --- Interfaces định nghĩa dữ liệu gửi lên (Payload) ---

export interface SendOtpPayload {
  email: string; //
}

export interface RegisterPayload {
  fullName: string; //
  email: string; //[cite: 3]
  password: string; //[cite: 3]
  confirmPassword: string; //[cite: 3]
  otp: string; //[cite: 3]
}

export interface LoginPayload {
  email: string; //[cite: 3]
  password: string; //[cite: 3]
}

export interface ForgotPasswordPayload {
  email: string; //[cite: 3]
}

export interface ResetPasswordPayload {
  password: string; //[cite: 3]
  confirmPassword: string; //[cite: 3]
}

export interface TokenPayload {
  refreshToken: string; //[cite: 3]
}

// --- Các hàm gọi API ---

export const authApi = {
  // Gửi OTP về email
  sendOtp: (data: SendOtpPayload) => 
    api.post('/auth/send-otp', data), //[cite: 3]

  // Đăng ký tài khoản mới
  register: (data: RegisterPayload) => 
    api.post('/auth/register', data), //[cite: 3]

  // Đăng nhập
  login: (data: LoginPayload) => 
    api.post('/auth/login', data), //[cite: 3]

  // Yêu cầu gửi email quên mật khẩu
  forgotPassword: (data: ForgotPasswordPayload) => 
    api.post('/auth/forgot-password', data), //[cite: 3]

  // Đặt lại mật khẩu với token từ URL
  resetPassword: (token: string, data: ResetPasswordPayload) => 
    api.post(`/auth/reset-password/${token}`, data), //[cite: 3]

  // Đăng xuất
  logout: (data: TokenPayload) => 
    api.post('/auth/logout', data), //[cite: 3]

  // Làm mới Access Token
  refreshToken: (data: TokenPayload) => 
    api.post('/auth/refresh-token', data), //[cite: 3]
};