import React, { useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { conversationApi } from '../../api/conversation.api';
import type { Conversation } from '../../types/conversation.type';
import { useAuthStore } from '../../store/auth.store';
import { SearchUser } from './SearchUser';
import { CreateGroupModal } from './modals/CreateGroupModal';
import { FriendRequestsModal } from './modals/FriendRequestsModal';
import { friendApi } from '../../api/friend.api';
import { userApi } from '../../api/user.api';
import type { User } from '../../types/user.type';
import { mapBackendConversations } from '../../lib/conversationMapper';
import { useSocket } from '../../hooks/useSocket';
import { ChatAvatar } from '../ChatAvatar';
import { useToastStore } from '../../store/toast.store';
import { useConfirmStore } from '../../store/confirm.store';

interface SidebarProps {
  activeConversationId?: string;
  onSelectConversation: (id: string, strangerFallbackUser?: User | null) => void;
  onSelectStranger?: (user: User) => void;

  // Lifted props
  conversations: Conversation[];
  friends: User[];
  requestsCount: number;
  isLoading: boolean;
  fetchConversations: (showLoading?: boolean) => Promise<any>;
  fetchFriendRequests: () => Promise<any>;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeConversationId, 
  onSelectConversation, 
  onSelectStranger,
  conversations,
  friends,
  requestsCount,
  isLoading,
  fetchConversations,
  fetchFriendRequests
}) => {
  const { user, logout, updateUser } = useAuthStore();
  const [error, setError] = useState<string>('');
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isFriendRequestsOpen, setIsFriendRequestsOpen] = useState(false);

  const [isStrangerFolderOpen, setIsStrangerFolderOpen] = useState(false);

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const profileMenuRef = React.useRef<HTMLDivElement>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const handleDeleteChat = async (conversationId: string) => {
    setActiveMenu(null);
    const confirmed = await useConfirmStore.getState().show({
      title: 'Xóa lịch sử trò chuyện',
      message: 'Bạn có chắc muốn xóa lịch sử đoạn chat này?',
      confirmText: 'Xóa',
    });
    if (!confirmed) return;
    try {
      await conversationApi.clearHistory(conversationId);
      if (activeConversationId === conversationId) {
        onSelectConversation('');
      }
      fetchConversations(false);
      useToastStore.getState().success('Đã xóa lịch sử đoạn chat thành công');
    } catch (error) {
      console.error(error);
      useToastStore.getState().error('Không thể xóa đoạn chat');
    }
  };

  const { echo, onEvent } = useSocket();

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem('refreshToken') || '';
    try {
      if (refreshToken) {
        await import('../../api/auth.api').then(m => m.authApi.logout({ refreshToken }));
      }
    } catch (err: unknown) {
      // ignore
    } finally {
      logout();
    }
  };

  useEffect(() => {
    if (!echo) return;
    const cleanupFriendRequest  = onEvent('friend-request',  async (data: any) => { 
      await fetchFriendRequests(); 
      useToastStore.getState().info(`${data.senderName || 'Ai đó'} đã gửi cho bạn một lời mời kết bạn!`);
    });
    const cleanupFriendAccepted = onEvent('friend-accepted', async (data: any) => { 
      await fetchFriendRequests(); 
      await fetchConversations(false); 
      useToastStore.getState().success(`${data.accepterName || 'Ai đó'} đã chấp nhận lời mời kết bạn!`);
    });
    const cleanupGroupAdded = onEvent('group-added', async (data: any) => {
      await fetchConversations(false);
      useToastStore.getState().success(data.message || 'Bạn đã được thêm vào một nhóm chat mới!');
    });
    return () => { 
      cleanupFriendRequest(); 
      cleanupFriendAccepted(); 
      cleanupGroupAdded(); 
    };
  }, [echo, onEvent, fetchFriendRequests, fetchConversations]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      useToastStore.getState().warning('Kích thước ảnh tối đa là 10MB');
      return;
    }

    setIsUploadingAvatar(true);
    setIsProfileMenuOpen(false);

    try {
      const res = await userApi.uploadAvatar(file);
      const updatedUser = (res.data as any).data ?? (res.data as any).user;
      if (updatedUser) {
        updateUser({
          _id:      updatedUser._id ?? String(updatedUser.id),
          id:       updatedUser.id,
          fullName: updatedUser.fullName,
          email:    updatedUser.email,
          avatar:   updatedUser.avatar,
        });
        useToastStore.getState().success('Cập nhật ảnh đại diện thành công!');
      }
    } catch (err: unknown) {
      let errMsg = 'Lỗi tải ảnh lên';
      if (err instanceof AxiosError) {
        errMsg = err.response?.data?.message || errMsg;
      }
      useToastStore.getState().error(errMsg);
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full md:w-[350px] border-r border-slate-100 bg-[#f8f9fa] flex flex-col h-full shrink-0 z-20">
      {/* Profile Header */}
      <div className="p-5 border-b border-slate-100 flex items-center gap-3 relative">
        <div className="relative" ref={profileMenuRef}>
          <div
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className={`relative w-12 h-12 rounded-full ${user?.avatar ? 'bg-slate-100' : 'bg-gradient-to-tr from-indigo-500 to-purple-600'} text-white flex items-center justify-center font-bold text-lg shadow-md ring-2 ring-white/60 cursor-pointer group`}
          >
            {isUploadingAvatar ? (
              <svg className="animate-spin w-5 h-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : user?.avatar ? (
              <img src={user.avatar} alt={user.fullName} className="w-full h-full rounded-full object-cover" />
            ) : (
              user?.fullName?.charAt(0).toUpperCase()
            )}
            {!isUploadingAvatar && (
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
            )}
          </div>

          {isProfileMenuOpen && (
            <div className="absolute top-[110%] left-0 w-56 bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] rounded-2xl py-2 z-50 animate-fade-in-up origin-top-left">
              <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleAvatarChange} />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-4 py-2.5 text-left text-[14px] font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors flex items-center gap-2.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                Thay đổi ảnh đại diện
              </button>
              <div className="h-px bg-slate-100 my-1"></div>
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2.5 text-left text-[14px] font-semibold text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                Đăng xuất
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 ml-1">
          <h3 className="font-bold text-slate-800 text-[15px] truncate">{user?.fullName}</h3>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
            <span className="text-xs text-slate-500 font-medium tracking-wide">Trực tuyến</span>
          </div>
        </div>
        <button
          onClick={() => setIsFriendRequestsOpen(true)}
          className="relative p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-white/60 rounded-xl transition-all"
          title="Lời mời kết bạn"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
          {requestsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-white">
              {requestsCount}
            </span>
          )}
        </button>
      </div>

      {/* Action Bar */}
      <div className="p-4 border-b border-slate-100 flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Tin nhắn</h2>
          <button
            onClick={() => setIsCreateGroupOpen(true)}
            className="text-[13px] flex items-center gap-1.5 text-blue-600 hover:text-blue-700 transition-colors font-semibold"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            Tạo nhóm
          </button>
        </div>
        <SearchUser onSelectUser={(u) => { if (onSelectStranger) onSelectStranger(u); }} />
      </div>

      {/* Stranger Folder Toggle */}
      {isStrangerFolderOpen && (
        <div className="px-5 py-3 border-b border-white/30 bg-indigo-50/50 flex items-center gap-2">
          <button
            onClick={() => setIsStrangerFolderOpen(false)}
            className="p-1 -ml-1 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-lg transition-all flex items-center justify-center"
            title="Quay lại danh sách chính"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <span className="text-[14px] font-bold text-slate-700">Tin nhắn người lạ</span>
        </div>
      )}

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {error && <div className="m-4 p-3 bg-red-50/80 backdrop-blur-sm text-red-600 rounded-xl text-xs font-medium text-center border border-red-100">{error}</div>}

        {isLoading ? (
          <div className="p-3 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3.5 p-3 rounded-2xl animate-pulse">
                <div className="w-12 h-12 bg-slate-200 rounded-full shrink-0" />
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-1/2" />
                  <div className="h-3 bg-slate-200 rounded w-5/6" />
                </div>
              </div>
            ))}
          </div>
        ) : (() => {
          const friendIds = new Set(friends.map(f => f._id));

          const deduplicateConversations = (convs: Conversation[]) => {
            const seenUsers = new Set<string>();
            return convs.filter(c => {
              if (c.isGroupChat) return true;
              const dedupKey = c.otherUserId || 'self';
              if (seenUsers.has(dedupKey)) return false;
              seenUsers.add(dedupKey);
              return true;
            });
          };

          const strangerConversations = deduplicateConversations(
            conversations.filter(c => !c.isGroupChat && c.otherUserId && !friendIds.has(c.otherUserId))
          );
          const normalConversations = deduplicateConversations(
            conversations.filter(c => c.isGroupChat || !c.otherUserId || friendIds.has(c.otherUserId!))
          );
          const listToRender = isStrangerFolderOpen ? strangerConversations : normalConversations;

          if (normalConversations.length === 0 && strangerConversations.length === 0 && !error) {
            return (
              <div className="p-8 flex flex-col items-center justify-center text-center h-full">
                <div className="w-16 h-16 bg-white/60 rounded-2xl flex items-center justify-center mb-4 border border-white">
                  <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                </div>
                <p className="text-slate-500 text-sm font-semibold">Chưa có cuộc trò chuyện nào</p>
                <p className="text-slate-400 text-xs mt-1">Hãy tìm kiếm hoặc tạo nhóm để bắt đầu</p>
              </div>
            );
          }

          return (
            <ul className="p-2.5 space-y-1">
              {!isStrangerFolderOpen && strangerConversations.length > 0 && (
                <li
                  onClick={() => setIsStrangerFolderOpen(true)}
                  className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all duration-200 border border-transparent hover:bg-orange-50/60 mb-2 group"
                >
                  <div className="relative w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center bg-orange-100 text-orange-500 group-hover:bg-orange-200 transition-colors shadow-sm">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-[15px] truncate text-orange-700">Tin nhắn người lạ</h4>
                    <p className="text-[13px] truncate text-orange-500/90 font-medium">{strangerConversations.length} cuộc trò chuyện</p>
                  </div>
                </li>
              )}

              {listToRender.map((conv) => (
                <li
                  key={conv.conversationId}
                  onClick={() => onSelectConversation(conv.conversationId)}
                  className={`relative flex items-center gap-3.5 p-3 rounded-2xl cursor-pointer transition-all duration-300 border group ${
                    activeConversationId === conv.conversationId
                      ? 'bg-white border-white shadow-[0_2px_10px_-2px_rgba(0,0,0,0.05)]'
                      : 'border-transparent hover:bg-slate-100'
                  }`}
                >
                  <div className={`relative w-12 h-12 shrink-0 rounded-full flex items-center justify-center text-white font-bold text-[15px] shadow-sm ${
                    conv.isGroupChat
                      ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                      : 'bg-gradient-to-br from-indigo-400 to-blue-500'
                  }`}>
                    {conv.otherUserAvatar && !conv.isGroupChat ? (
                      <img src={conv.otherUserAvatar} alt={conv.chatName} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      (conv.chatName || '?').charAt(0).toUpperCase()
                    )}
                    {conv.isGroupChat && (
                      <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                        <div className="bg-purple-500 text-white rounded-full w-[14px] h-[14px] flex items-center justify-center">
                          <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className={`text-[14px] truncate mb-0.5 ${
                      activeConversationId === conv.conversationId 
                        ? 'text-indigo-900 font-extrabold' 
                        : conv.unreadCount && conv.unreadCount > 0 
                          ? 'text-slate-900 font-black' 
                          : 'text-slate-800 font-bold'
                    }`}>
                      {conv.chatName}
                    </h4>
                    <p className={`text-[12px] truncate ${
                      activeConversationId === conv.conversationId 
                        ? 'text-blue-600/80 font-semibold' 
                        : conv.unreadCount && conv.unreadCount > 0 
                          ? 'text-slate-900 font-extrabold' 
                          : 'text-slate-500 font-medium'
                    }`}>
                      {conv.latestMessage?.content
                        ? (conv.latestMessage.content.length > 30 ? conv.latestMessage.content.substring(0, 30) + '...' : conv.latestMessage.content)
                        : 'Nhấn để xem tin nhắn...'}
                    </p>
                  </div>

                  {conv.unreadCount && conv.unreadCount > 0 ? (
                    <div className="flex h-[20px] min-w-[20px] px-1.5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white shadow-sm shrink-0 select-none animate-pulse">
                      {conv.unreadCount}
                    </div>
                  ) : null}
                  
                  <div className="absolute right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setActiveMenu(activeMenu === conv.conversationId ? null : conv.conversationId); 
                      }}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                    </button>
                    {activeMenu === conv.conversationId && (
                      <div className="absolute right-0 mt-1 w-36 bg-white rounded-xl shadow-lg border border-slate-100 z-50 animate-fade-in-up">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteChat(conv.conversationId); }}
                          className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          Xóa đoạn chat
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          );
        })()}
      </div>

      {isCreateGroupOpen && (
        <CreateGroupModal
          onClose={() => setIsCreateGroupOpen(false)}
          onSuccess={() => { setIsCreateGroupOpen(false); fetchConversations(); }}
        />
      )}

      {isFriendRequestsOpen && (
        <FriendRequestsModal
          onClose={() => { setIsFriendRequestsOpen(false); fetchFriendRequests(); fetchConversations(); }}
        />
      )}
    </div>
  );
};