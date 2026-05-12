import React, { useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { conversationApi } from '../../api/conversation.api';
import type { Conversation } from '../../types/conversation.type';
import { useAuthStore } from '../../store/auth.store';

interface SidebarProps {
  activeConversationId?: number;
  onSelectConversation: (id: number) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeConversationId, onSelectConversation }) => {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await conversationApi.getConversations();
        setConversations(res.data);
      } catch (err: unknown) {
        if (err instanceof AxiosError) {
          setError(err.response?.data?.message || 'Không thể tải danh sách chat');
        }
      }
    };
    fetchConversations();
  }, []);

  return (
    <div className="w-full md:w-80 border-r bg-white flex flex-col h-full">
      {/* Profile Header */}
      <div className="p-4 border-b bg-gray-50 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
          {user?.FullName?.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-gray-800 text-sm truncate">{user?.FullName}</h3>
          <span className="text-xs text-green-500">Trực tuyến</span>
        </div>
      </div>

      {/* Search Input (Có thể gắn SearchUser component vào đây) */}
      <div className="p-3 border-b">
        <input 
          type="text" 
          placeholder="Tìm kiếm người dùng hoặc nhóm..." 
          className="w-full p-2 bg-gray-100 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {error && <div className="p-3 text-red-500 text-xs text-center">{error}</div>}
        
        {conversations.length === 0 && !error ? (
          <div className="p-4 text-center text-gray-400 text-sm">Chưa có tin nhắn nào</div>
        ) : (
          <ul>
            {conversations.map((conv) => (
              <li 
                key={conv.ConversationId}
                onClick={() => onSelectConversation(conv.ConversationId)}
                className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition ${
                  activeConversationId === conv.ConversationId ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
              >
                <h4 className="font-semibold text-gray-800 text-sm truncate">{conv.ChatName}</h4>
                {/* Ở đây có thể render LatestMessage nếu API trả về chi tiết LatestMessage */}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};