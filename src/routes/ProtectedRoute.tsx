import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  // Lấy token từ store để kiểm tra đăng nhập thay vì isAuthenticated
  const { token } = useAuthStore();

  // Nếu không có token, điều hướng về trang login và xóa lịch sử route hiện tại
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};