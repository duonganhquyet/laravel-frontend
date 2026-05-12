import React from 'react';
import type { Conversation } from '../../types/conversation.type';

interface ChatHeaderProps {
  conversation: Conversation | null;
  onOpenSidebar?: () => void; // Dùng cho mobile
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ conversation, onOpenSidebar }) => {
  if (!conversation) return <div className="h-16 border-b bg-white flex items-center px-4 shadow-sm text-gray-500">Chưa chọn cuộc trò chuyện</div>;

  return (
    <div className="h-16 border-b bg-white flex items-center justify-between px-4 shadow-sm z-10 relative">
      <div className="flex items-center gap-3">
        {/* Nút menu cho mobile */}
        <button onClick={onOpenSidebar} className="md:hidden text-gray-500 hover:text-gray-700">
          ☰
        </button>
        
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
          {conversation.ChatName.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="font-semibold text-gray-800">{conversation.ChatName}</h2>
          <span className="text-xs text-green-500">
            {conversation.IsGroupChat ? 'Nhóm trò chuyện' : 'Đang hoạt động'}
          </span>
        </div>
      </div>
      
      <div className="flex gap-2">
        <button className="p-2 text-gray-400 hover:text-blue-500 transition" title="Tìm kiếm tin nhắn">🔍</button>
        <button className="p-2 text-gray-400 hover:text-blue-500 transition" title="Thông tin">ℹ️</button>
      </div>
    </div>
  );
};