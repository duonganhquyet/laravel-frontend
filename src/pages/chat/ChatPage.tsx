import React, { useState, useEffect, useCallback } from 'react';
import { AxiosError } from 'axios';
import { Sidebar } from '../../components/chat/Sidebar';
import { ChatWindow } from '../../components/chat/ChatWindow';
import { ChatHeader } from '../../components/chat/ChatHeader';
import type { Conversation, ConversationParticipant } from '../../types/conversation.type';
import { conversationApi, participantApi } from '../../api/conversation.api';
import { friendApi } from '../../api/friend.api';
import { AddMemberModal } from '../../components/chat/modals/AddMemberModal';
import { GroupMembersModal } from '../../components/chat/modals/GroupMembersModal';
import { NotesModal } from '../../components/chat/modals/NotesModal';
import { PollsModal } from '../../components/chat/modals/PollsModal';
import { UserProfileView } from '../../components/chat/UserProfileView';
import { ChatInfoDrawer } from '../../components/chat/ChatInfoDrawer';
import { MessageSearch } from '../../components/chat/MessageSearch';
import type { User } from '../../types/user.type';
import { mapBackendConversations } from '../../lib/conversationMapper';
import { useSocket } from '../../hooks/useSocket';
import { useToastStore } from '../../store/toast.store';

interface ToastNotification {
  id: string;
  conversationId: string;
  senderName: string;
  senderAvatar: string | null;
  chatName: string;
  content: string;
}

const playChime = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = audioCtx.currentTime;
    
    const playTone = (freq: number, start: number, duration: number) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      
      gain.gain.setValueAtTime(0.08, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start(start);
      osc.stop(start + duration);
    };
    
    playTone(880, now, 0.12);
    playTone(1320, now + 0.08, 0.25);
  } catch (e) {
    console.error('Audio play failed', e);
  }
};

export const ChatPage: React.FC = () => {
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>();
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [participants, setParticipants] = useState<ConversationParticipant[]>([]);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Lifted Sidebar States
  const [friends, setFriends] = useState<User[]>([]);
  const [requestsCount, setRequestsCount] = useState(0);
  const [isLoadingSidebar, setIsLoadingSidebar] = useState(true);

  const fetchParticipants = async (id: string) => {
    try {
      const res = await participantApi.getParticipants(id);
      const data = (res.data as any).data || res.data || [];
      setParticipants(data);
    } catch (e) {
      console.error('Failed to fetch participants', e);
    }
  };

  useEffect(() => {
    if (activeConversationId) {
      fetchParticipants(activeConversationId);
    } else {
      setParticipants([]);
    }
  }, [activeConversationId]);

  const { onEvent } = useSocket();

  // Yêu cầu quyền thông báo trình duyệt khi truy cập trang
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Lắng nghe thông báo tin nhắn mới qua socket
  useEffect(() => {
    const cleanup = onEvent('new_message_notification', (data: any) => {
      // Re-fetch conversations to refresh unread badges and sidebar messages
      fetchConversations(false);

      if (data.conversationId === activeConversationId) {
        return;
      }

      let displayContent = data.content;
      if (data.messageType === 'image') displayContent = '📷 [Hình ảnh]';
      else if (data.messageType === 'video') displayContent = '🎥 [Video]';
      else if (data.messageType === 'file') displayContent = '📁 [Tài liệu]';

      const toastId = Math.random().toString(36).substring(2, 9);
      
      playChime();

      if (Notification.permission === 'granted') {
        new Notification(data.chatName || 'Tin nhắn mới', {
          body: displayContent,
          tag: data.conversationId,
        });
      }

      const newToast: ToastNotification = {
        id: toastId,
        conversationId: data.conversationId,
        senderName: data.sender?.fullName || 'Người dùng',
        senderAvatar: data.sender?.avatar || null,
        chatName: data.chatName || 'Tin nhắn mới',
        content: displayContent,
      };

      setToasts((prev) => [...prev, newToast]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toastId));
      }, 5000);
    });

    return () => {
      cleanup();
    };
  }, [activeConversationId, onEvent]);

  // Modals state
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isGroupMembersOpen, setIsGroupMembersOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isPollsOpen, setIsPollsOpen] = useState(false);

  // Custom Drawers / Popups
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);


  // Stranger Profile state
  const [selectedStranger, setSelectedStranger] = useState<User | null>(null);
  const [strangerChatUser, setStrangerChatUser] = useState<User | null>(null);

  const fetchConversations = useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoadingSidebar(true);
    try {
      const res = await conversationApi.getConversations();
      const rawData = (res.data as any).data || res.data || [];
      const convs = mapBackendConversations(rawData);
      setConversations(convs);

      if (activeConversationId) {
        const fresh = convs.find(c => c.conversationId === activeConversationId);
        if (fresh) {
          setActiveConversation(fresh);
        }
      }
      return convs;
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        const message = err.response?.data?.message || err.message;
        console.error('Lỗi khi tải danh sách cuộc trò chuyện:', message);
      }
      return [] as Conversation[];
    } finally {
      if (showLoading) setIsLoadingSidebar(false);
    }
  }, [activeConversationId]);

  const fetchFriendRequests = useCallback(async () => {
    try {
      const reqs = await friendApi.getFriendRequests();
      setRequestsCount(reqs.length);
      const friendList = await friendApi.getFriends();
      setFriends(friendList);
    } catch (e) {
      console.error('Lỗi tải danh sách bạn bè:', e);
    }
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoadingSidebar(true);
      await Promise.all([
        fetchConversations(false),
        fetchFriendRequests()
      ]);
      setIsLoadingSidebar(false);
    };
    loadInitialData();
  }, []);

  const handleSelectConversation = async (id: string, strangerFallbackUser?: User | null) => {
    setActiveConversationId(id);
    setSelectedStranger(null);
    setStrangerChatUser(strangerFallbackUser || null);

    // Reset unread count locally immediately for responsive feedback
    setConversations(prev =>
      prev.map(c => c.conversationId === id ? { ...c, unreadCount: 0 } : c)
    );

    let currentConversation = conversations.find((c) => c.conversationId === id);
    if (!currentConversation) {
      const convs = await fetchConversations(false);
      currentConversation = convs.find((c) => c.conversationId === id);
    }

    if (currentConversation) {
      // Ensure the active conversation object also has unreadCount reset
      setActiveConversation({ ...currentConversation, unreadCount: 0 });
      setStrangerChatUser(null);
    } else {
      setActiveConversation(null);
    }
  };

  const handleViewUserProfile = useCallback(async (userId: string) => {
    try {
      const res = await import('../../api/user.api').then(m => m.userApi.getUserById(userId));
      const fetchedUser = (res.data as any).data ?? res.data;
      if (fetchedUser) {
        setSelectedStranger(fetchedUser);
        setStrangerChatUser(null);
        setActiveConversationId(undefined);
        setActiveConversation(null);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  return (
    <div className="flex h-screen overflow-hidden font-sans bg-slate-50">
      <Sidebar
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onSelectStranger={(user) => {
          setSelectedStranger(user);
          setStrangerChatUser(null);
          setActiveConversationId(undefined); // Tắt chat hiện tại
          setActiveConversation(null);
        }}
        conversations={conversations}
        friends={friends}
        requestsCount={requestsCount}
        isLoading={isLoadingSidebar}
        fetchConversations={fetchConversations}
        fetchFriendRequests={fetchFriendRequests}
      />

      <div className="flex-1 flex flex-col relative bg-transparent">
        {(() => {
          const isGroupClosed = !!(activeConversation?.isGroupChat && participants.length > 0 && participants.length < 3);
          return (
            <>
              <ChatHeader
                conversation={activeConversation}
                strangerUser={selectedStranger || strangerChatUser}
                onOpenAddMember={() => setIsAddMemberOpen(true)}
                onOpenGroupMembers={() => setIsGroupMembersOpen(true)}
                onOpenNotes={() => setIsNotesOpen(true)}
                onOpenPolls={() => setIsPollsOpen(true)}
                onToggleSearch={() => setIsSearchOpen(!isSearchOpen)}
                onToggleInfo={() => setIsInfoOpen(!isInfoOpen)}
                isSearchOpen={isSearchOpen}
                isInfoOpen={isInfoOpen}
                isClosed={isGroupClosed}
                onAvatarClick={handleViewUserProfile}
              />

              {isSearchOpen && activeConversationId && !isGroupClosed && (
                <div className="absolute top-16 right-0 z-30 mr-4 mt-2">
                  <MessageSearch conversationId={activeConversationId} onClose={() => setIsSearchOpen(false)} />
                </div>
              )}

              {selectedStranger ? (
                <UserProfileView
                  user={selectedStranger}
                  onClose={() => setSelectedStranger(null)}
                  onStartChat={(convId) => {
                    const stranger = selectedStranger;
                    handleSelectConversation(convId, stranger);
                  }}
                  friends={friends}
                />
              ) : activeConversationId ? (
                <div className="flex-1 overflow-hidden relative flex">
                  <div className="flex-1 relative">
                    <ChatWindow 
                      conversation={activeConversation} 
                      conversationId={activeConversationId} 
                      participants={participants}
                      onRefreshParticipants={() => { fetchParticipants(activeConversationId); fetchConversations(false); }}
                      onAvatarClick={handleViewUserProfile}
                      onCloseChat={() => {
                        setActiveConversationId(undefined);
                        setActiveConversation(null);
                        fetchConversations(false);
                        useToastStore.getState().info('Nhóm chat đã bị giải tán bởi trưởng nhóm!');
                      }}
                    />
                  </div>
                  {isInfoOpen && !isGroupClosed && (
                    <ChatInfoDrawer conversationId={activeConversationId} onClose={() => setIsInfoOpen(false)} />
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center relative bg-white">
                  <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                    <svg className="w-10 h-10 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2 tracking-tight">Chào mừng bạn trở lại</h2>
                  <p className="text-slate-500 font-medium">Chọn một cuộc trò chuyện để bắt đầu nhắn tin</p>
                </div>
              )}

              {/* Modals */}
              {isAddMemberOpen && activeConversationId && (
                <AddMemberModal
                  conversationId={activeConversationId}
                  onClose={() => setIsAddMemberOpen(false)}
                  onRefresh={() => { fetchParticipants(activeConversationId); fetchConversations(false); }}
                />
              )}
              {isGroupMembersOpen && activeConversation && (
                <GroupMembersModal
                  conversation={activeConversation}
                  onClose={() => setIsGroupMembersOpen(false)}
                  onRefresh={() => { fetchParticipants(activeConversation._id); fetchConversations(false); }}
                  onLeaveGroup={() => {
                    setActiveConversationId(undefined);
                    setActiveConversation(null);
                  }}
                />
              )}
              {isNotesOpen && activeConversationId && (
                <NotesModal
                  conversationId={activeConversationId}
                  onClose={() => setIsNotesOpen(false)}
                />
              )}
              {isPollsOpen && activeConversationId && (
                <PollsModal
                  conversationId={activeConversationId}
                  onClose={() => setIsPollsOpen(false)}
                />
              )}
            </>
          );
        })()}
      </div>

      {/* Toast notifications container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            onClick={() => {
              handleSelectConversation(toast.conversationId);
              setToasts((prev) => prev.filter((t) => t.id !== toast.id));
            }}
            className="pointer-events-auto flex items-start gap-3 p-4 bg-white/95 border border-slate-200/80 shadow-[0_10px_30px_rgba(0,0,0,0.08)] rounded-2xl cursor-pointer hover:bg-slate-50 transition-all duration-200 animate-slide-in-right relative overflow-hidden group"
          >
            {/* Visual left colored accent bar */}
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-500 rounded-l-2xl"></div>
            
            {/* Avatar */}
            <div className="shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center text-white font-bold shadow-sm select-none">
              {toast.senderAvatar ? (
                <img src={toast.senderAvatar} alt={toast.senderName} className="w-full h-full rounded-full object-cover" />
              ) : (
                toast.senderName.charAt(0).toUpperCase()
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pr-4">
              <h4 className="font-bold text-[14px] text-slate-800 truncate leading-snug">
                {toast.chatName}
              </h4>
              {toast.chatName !== toast.senderName && (
                <p className="text-[11px] font-bold text-slate-400 mt-0.5 truncate uppercase tracking-wider">
                  {toast.senderName}
                </p>
              )}
              <p className="text-[13px] text-slate-600 font-medium truncate mt-1">
                {toast.content}
              </p>
            </div>

            {/* Dismiss button */}
            <button
              onClick={(e) => {
                e.stopPropagation(); // Avoid selecting conversation
                setToasts((prev) => prev.filter((t) => t.id !== toast.id));
              }}
              className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors shrink-0 -mt-1 -mr-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};