import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Import bằng ngoặc nhọn vì các component trước đó dùng "export const"
import { LoginPage } from "../pages/auth/LoginPage";
import { RegisterPage } from "../pages/auth/RegisterPage";
import { ChatPage } from "../pages/chat/ChatPage";
import { ProtectedRoute } from "./ProtectedRoute";

export const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Các Route Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Các Route Private (Yêu cầu đăng nhập) */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />

        {/* Bắt mọi đường dẫn sai và trả về trang chủ */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};