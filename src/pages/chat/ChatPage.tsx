import React, { useState } from 'react';
import { AxiosError } from 'axios';
import { Sidebar } from '../../components/chat/Sidebar';
import { ChatWindow } from '../../components/chat/ChatWindow';
import { ChatHeader } from '../../components/chat/ChatHeader';
import { useAuthStore } from '../../store/auth.store';
import type { Conversation } from '../../types/conversation.type';
import { conversationApi } from '../../api/conversation.api';
import { authApi } from '../../api/auth.api';
import './ChatPage.css';

export const ChatPage: React.FC = () => {
  const { logout } = useAuthStore();
  const [activeConversationId, setActiveConversationId] = useState<number | undefined>();
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);

  // Hàm xử lý khi người dùng click chọn một cuộc trò chuyện ở Sidebar
  const handleSelectConversation = async (id: number) => {
    setActiveConversationId(id);
    try {
      const res = await conversationApi.getConversations(); 
      const current = res.data.find(c => c.ConversationId === id);
      if (current) {
        setActiveConversation(current);
      }
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        console.error("Lỗi khi tải thông tin cuộc trò chuyện:", err.response?.data?.message || err.message);
      } else {
        console.error("Lỗi không xác định khi tải cuộc trò chuyện.");
      }
    }
  };

  // Hàm xử lý đăng xuất an toàn
  const handleLogout = async () => {
    // Lấy token từ localStorage (hoặc store) để gửi lên backend hủy phiên làm việc
    const refreshToken = localStorage.getItem('token') || ''; 
    
    try {
      if (refreshToken) {
        await authApi.logout({ refreshToken });
      }
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        console.error("Lỗi gọi API đăng xuất:", err.response?.data?.message || err.message);
      }
    } finally {
      // Đảm bảo luôn xóa thông tin user ở frontend cho dù gọi API có lỗi hay không
      logout(); 
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Cột trái: Sidebar chứa danh sách chat */}
      <Sidebar 
        activeConversationId={activeConversationId} 
        onSelectConversation={handleSelectConversation} 
      />

      {/* Cột phải: Khu vực làm việc chính */}
      <div className="flex-1 flex flex-col relative">
        {/* Header trên cùng (Hiển thị tên người đang chat / tên nhóm) */}
        <ChatHeader conversation={activeConversation} />

        {/* Nội dung bên dưới Header */}
        {activeConversationId ? (
          <div className="flex-1 overflow-hidden">
            {/* Truyền ID cuộc trò chuyện xuống để render tin nhắn */}
            <ChatWindow conversationId={activeConversationId} />
          </div>
        ) : (
          /* Màn hình chờ khi chưa chọn cuộc trò chuyện nào */
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50">
            <div className="text-6xl mb-4">💬</div>
            <h2 className="text-xl font-semibold text-gray-700">Chào mừng đến với hệ thống Chat</h2>
            <p className="text-gray-500 mt-2">Chọn một cuộc trò chuyện bên trái để bắt đầu nhắn tin</p>
            
            <button 
              onClick={handleLogout} 
              className="mt-6 px-4 py-2 bg-red-100 text-red-600 font-medium rounded hover:bg-red-200 transition focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              Đăng xuất
            </button>
          </div>
        )}
      </div>
    </div>
  );
};