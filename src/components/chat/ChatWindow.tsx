import React, { useEffect, useState, useRef } from 'react';
import { AxiosError } from 'axios';
import { messageApi } from '../../api/message.api';
import type { Message } from '../../types/message.type';
import { useSocket } from '../../hooks/useSocket';
import { useAuthStore } from '../../store/auth.store';
import { useToastStore } from '../../store/toast.store';
import MessageInput from './MessageInput';
import { mapBackendMessage, mapBackendMessages, type BackendMessage } from '../../lib/messageMapper';
import { conversationApi, noteApi } from '../../api/conversation.api';
import { mapNote } from '../../api/group.api';
import type { ConversationParticipant } from '../../types/conversation.type';
import { MessageItem } from './MessageItem';
import { ChatAvatar } from '../ChatAvatar';

interface ChatWindowProps {
  conversationId: string;
  conversation: any;
  participants: ConversationParticipant[];
  onAvatarClick?: (userId: string) => void;
  onRefreshParticipants?: () => void;
  onCloseChat?: () => void;
  targetMessageId?: string;
  onMessageScrolled?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ conversationId, conversation, participants, onAvatarClick, onRefreshParticipants, onCloseChat, targetMessageId, onMessageScrolled }) => {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string>('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [latestNote, setLatestNote] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState<boolean>(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const hasMore = page < totalPages;

  const { onMessageReceived, onTyping, onStopTyping, onMessagesRead, onMessageUpdated, onMessageDeleted, onParticipantsUpdated } = useSocket(conversationId);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError('');
      setMessages([]);
      setLatestNote(null);
      setPage(1);
      setTotalPages(1);

      try {
        await Promise.all([
          (async () => {
            try {
              const res = await messageApi.getMessages(conversationId.toString(), 1, 30);
              const data = res.data?.data;
              setMessages(mapBackendMessages(data?.messages || []));
              setPage(1);
              setTotalPages(data?.totalPages || 1);
            } catch (err: unknown) {
              if (err instanceof AxiosError) {
                setError(err.response?.data?.message || 'Lỗi khi tải tin nhắn.');
              } else {
                setError('Lỗi không xác định khi tải tin nhắn.');
              }
            }
          })(),
          (async () => {
            try {
              const res = await noteApi.getNotes(conversationId);
              const notes = ((res.data as any).data || res.data || []).map(mapNote);
              setLatestNote(notes.length > 0 ? notes[0] : null);
            } catch (err) {
              console.error('Failed to fetch notes', err);
            }
          })()
        ]);
      } catch (err) {
        console.error('Error loading chat data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (conversationId) {
      loadData();
    }
  }, [conversationId]);

  // Mark as read when messages load
  useEffect(() => {
    if (messages.length > 0 && user) {
      const currentUserId = user._id ?? (user.id ? String(user.id) : '');
      if (currentUserId) {
        const hasUnread = messages.some(msg => {
          const senderId = msg.sender?._id;
          return senderId && String(senderId) !== String(currentUserId) && 
            !msg.readBy?.some(r => String(r._id) === String(currentUserId));
        });
        if (hasUnread) {
          conversationApi.markAsRead(conversationId).catch(console.error);
        }
      }
    }
  }, [messages, conversationId, user]);

  // Real-time: receive new messages
  useEffect(() => {
    const cleanup = onMessageReceived((newMessage: BackendMessage) => {
      const mapped = mapBackendMessage(newMessage);
      if (mapped.conversationId === conversationId) {
        setMessages(prev => {
          if (prev.some(m => m._id === mapped._id)) return prev;
          return [...prev, mapped];
        });

        // Refresh notes if system message about notes or a new note is created
        if (
          (mapped.messageType === 'system' && mapped.content?.toLowerCase().includes('ghi chú')) ||
          mapped.messageType === 'note'
        ) {
          noteApi.getNotes(conversationId).then(res => {
            const notes = ((res.data as any).data || res.data || []).map(mapNote);
            setLatestNote(notes.length > 0 ? notes[0] : null);
          });
        }
      }
    });

    const cleanupRead = onMessagesRead(({ conversationId: eventRoomId, userId }) => {
      if (eventRoomId === conversationId) {
        const participant = participants.find(p => String(p.userId) === String(userId));
        const readerInfo = { _id: String(userId), fullName: participant?.fullName || '', avatar: participant?.avatar ?? null };
        setMessages(prev =>
          prev.map(msg => {
            const senderId = msg.sender?._id;
            if (senderId && String(senderId) !== String(userId) && !msg.readBy?.some(r => String(r._id) === String(userId))) {
              return { ...msg, readBy: [...(msg.readBy || []), readerInfo] };
            }
            return msg;
          })
        );
      }
    });

    const cleanupUpdated = onMessageUpdated((updatedMessage: BackendMessage) => {
      const mapped = mapBackendMessage(updatedMessage);
      if (mapped.conversationId === conversationId) {
        setMessages(prev => prev.map(m => m._id === mapped._id ? mapped : m));
      }
    });

    const cleanupDeleted = onMessageDeleted((deletedMessage: BackendMessage) => {
      const mapped = mapBackendMessage(deletedMessage);
      if (mapped.conversationId === conversationId) {
        setMessages(prev => prev.map(m => m._id === mapped._id ? mapped : m));
      }
    });

    const cleanupParticipants = onParticipantsUpdated((payload) => {
      if (payload.Action === 'disband' as any) {
        onCloseChat?.();
      } else {
        onRefreshParticipants?.();
      }
    });

    return () => { cleanup(); cleanupRead(); cleanupUpdated(); cleanupDeleted(); cleanupParticipants(); };
  }, [conversationId, onMessageReceived, onMessagesRead, onMessageUpdated, onMessageDeleted, onParticipantsUpdated, onRefreshParticipants, participants, onCloseChat]);

  // Listen for local notes-updated custom event
  useEffect(() => {
    const handleNotesUpdated = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.conversationId === conversationId) {
        noteApi.getNotes(conversationId).then(res => {
          const notes = ((res.data as any).data || res.data || []).map(mapNote);
          setLatestNote(notes.length > 0 ? notes[0] : null);
        }).catch(err => {
          console.error('Failed to fetch notes on notes-updated event', err);
        });
      }
    };

    window.addEventListener('notes-updated', handleNotesUpdated);
    return () => {
      window.removeEventListener('notes-updated', handleNotesUpdated);
    };
  }, [conversationId]);

  // Typing indicators
  useEffect(() => {
    const cleanupTyping = onTyping(payload => {
      if (payload.roomId === conversationId && payload.userId && payload.userId !== user?._id) {
        setTypingUsers(prev => prev.includes(payload.userId!) ? prev : [...prev, payload.userId!]);
      }
    });
    const cleanupStop = onStopTyping(payload => {
      if (payload.roomId === conversationId && payload.userId) {
        setTypingUsers(prev => prev.filter(id => id !== payload.userId));
      }
    });
    return () => { cleanupTyping(); cleanupStop(); };
  }, [conversationId, onTyping, onStopTyping, user]);

  const scrollToBottom = (behavior: 'smooth' | 'auto' = 'smooth') => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior,
      });
    }
  };

  const loadMoreMessages = async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);

    const nextPage = page + 1;
    try {
      const res = await messageApi.getMessages(conversationId.toString(), nextPage, 30);
      const data = res.data?.data;
      const oldMessages = mapBackendMessages(data?.messages || []);

      if (oldMessages.length > 0) {
        const container = scrollContainerRef.current;
        const previousScrollHeight = container ? container.scrollHeight : 0;
        const previousScrollTop = container ? container.scrollTop : 0;

        setMessages(prev => [...oldMessages, ...prev]);
        setPage(nextPage);
        setTotalPages(data?.totalPages || 1);

        setTimeout(() => {
          if (container) {
            const newScrollHeight = container.scrollHeight;
            container.scrollTop = previousScrollTop + (newScrollHeight - previousScrollHeight);
          }
        }, 50);
      }
    } catch (err) {
      console.error('Failed to load more messages', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;

    const isNearBottom = scrollHeight - scrollTop - clientHeight < 400;
    setShowScrollBottomBtn(!isNearBottom);

    if (scrollTop < 50 && hasMore && !isLoadingMore) {
      loadMoreMessages();
    }
  };

  useEffect(() => {
    if (!isLoading) {
      setTimeout(() => {
        scrollToBottom('auto');
      }, 50);
    }
  }, [isLoading]);

  useEffect(() => {
    if (messages.length === 0 || isLoading) return;

    const lastMsg = messages[messages.length - 1];
    const isMine = lastMsg?.sender?._id === user?._id;

    const container = scrollContainerRef.current;
    if (container) {
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 250;
      if (isNearBottom || isMine) {
        scrollToBottom('smooth');
      }
    }
  }, [messages, user, isLoading]);

  const [searchAttempt, setSearchAttempt] = useState(0);

  useEffect(() => {
    if (!targetMessageId || isLoading) return;

    const el = document.getElementById(`message-${targetMessageId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('bg-indigo-50', 'transition-colors', 'duration-1000');
      setTimeout(() => el.classList.remove('bg-indigo-50'), 2000);
      onMessageScrolled?.();
      setSearchAttempt(0);
    } else {
      if (hasMore && !isLoadingMore && searchAttempt < 10) {
        setSearchAttempt(prev => prev + 1);
        loadMoreMessages();
      } else if (searchAttempt >= 10 || !hasMore) {
        useToastStore.getState().error('Không thể tìm thấy tin nhắn trong lịch sử gần đây.');
        onMessageScrolled?.();
        setSearchAttempt(0);
      }
    }
  }, [targetMessageId, messages, isLoading, hasMore, isLoadingMore, searchAttempt, onMessageScrolled]);

  return (
    <div className="absolute inset-0 flex flex-col bg-transparent">
      {error && <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-red-100 text-red-600 px-4 py-2 rounded-full text-sm font-medium shadow-md border border-red-200">{error}</div>}

      {/* Pinned Note */}
      {latestNote && !isLoading && (
        <div className="bg-amber-50/90 backdrop-blur-md border-b border-amber-200/60 px-4 py-2.5 flex items-start gap-3 shrink-0 shadow-sm z-10 transition-all animate-fade-in-up">
          <div className="bg-amber-100 text-amber-600 p-1.5 rounded-lg shrink-0 mt-0.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-[10px] font-bold text-amber-700/80 mb-0.5 uppercase tracking-wider">
              Ghi chú ghim • Đăng bởi {latestNote.creatorName || `Người dùng #${latestNote.createdByUserId}`}
            </p>
            <p className="text-sm text-slate-700 line-clamp-2">{latestNote.content}</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 pt-6 pb-32 space-y-6 custom-scrollbar relative z-0">
          {/* Skeleton 1: Left */}
          <div className="flex items-end gap-3 max-w-[70%] animate-pulse">
            <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0" />
            <div className="flex flex-col gap-1.5 flex-1">
              <div className="h-3 bg-slate-200 rounded-md w-24 mb-1" />
              <div className="h-10 bg-slate-200 rounded-2xl rounded-bl-sm w-5/6" />
            </div>
          </div>

          {/* Skeleton 2: Right */}
          <div className="flex items-end justify-end gap-3 ml-auto max-w-[70%] animate-pulse">
            <div className="flex flex-col gap-1.5 flex-1 items-end">
              <div className="h-12 bg-indigo-100/50 rounded-2xl rounded-br-sm w-3/4" />
            </div>
          </div>

          {/* Skeleton 3: Left */}
          <div className="flex items-end gap-3 max-w-[70%] animate-pulse">
            <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0" />
            <div className="flex flex-col gap-1.5 flex-1">
              <div className="h-3 bg-slate-200 rounded-md w-16 mb-1" />
              <div className="h-16 bg-slate-200 rounded-2xl rounded-bl-sm w-full" />
            </div>
          </div>

          {/* Skeleton 4: Right */}
          <div className="flex items-end justify-end gap-3 ml-auto max-w-[70%] animate-pulse">
            <div className="flex flex-col gap-1.5 flex-1 items-end">
              <div className="h-8 bg-indigo-100/50 rounded-2xl rounded-br-sm w-1/2" />
            </div>
          </div>

          {/* Skeleton 5: Left */}
          <div className="flex items-end gap-3 max-w-[70%] animate-pulse">
            <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0" />
            <div className="flex flex-col gap-1.5 flex-1">
              <div className="h-3 bg-slate-200 rounded-md w-32 mb-1" />
              <div className="h-10 bg-slate-200 rounded-2xl rounded-bl-sm w-2/3" />
            </div>
          </div>

          {/* Centered Premium Loading Spinner */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-white/95 backdrop-blur-md px-6 py-4 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.08)] border border-slate-100/80 flex items-center gap-3 animate-fade-in pointer-events-auto">
              <svg className="animate-spin h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-sm font-semibold text-slate-700 tracking-wide select-none">Đang tải tin nhắn...</span>
            </div>
          </div>
        </div>
      ) : (
        <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 sm:px-8 pt-4 pb-32 custom-scrollbar relative z-0">
          {isLoadingMore && (
            <div className="flex justify-center items-center py-3">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          {messages.length === 0 && !isLoadingMore && (
            <div className="h-[75%] flex flex-col items-center justify-center text-center p-8 select-none animate-fade-in">
              <div className="w-20 h-20 rounded-3xl bg-indigo-50 flex items-center justify-center mb-6 shadow-sm ring-4 ring-indigo-50/50">
                <svg className="w-10 h-10 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">
                {conversation?.isGroupChat 
                  ? `Chào mừng bạn đến với nhóm ${conversation?.chatName || ''}` 
                  : `Nhắn tin với ${conversation?.chatName || 'người dùng'}`}
              </h3>
              <p className="text-slate-500 text-sm max-w-sm font-medium leading-relaxed">
                {conversation?.isGroupChat 
                  ? 'Hãy gửi tin nhắn đầu tiên để kết nối và bắt đầu thảo luận cùng mọi người trong nhóm! 💬' 
                  : 'Hãy gửi tin nhắn đầu tiên, lời chào 👋 hoặc thả nút Like 👍 để kết nối trực tiếp với đối phương!'}
              </p>
            </div>
          )}

          {(() => {
            const currentUserId = user?._id ?? (user?.id ? String(user.id) : '');

            // Track latest read index per reader
            const latestReadIndices: Record<string, number> = {};
            messages.forEach((msg, index) => {
              msg.readBy?.forEach(reader => {
                const readerId = String(reader._id);
                if (currentUserId && readerId !== String(currentUserId)) {
                  latestReadIndices[readerId] = index;
                }
              });
            });

            return messages.map((msg, index) => {
              const isMine = msg.sender?._id && currentUserId ? String(msg.sender._id) === String(currentUserId) : false;
              const readByUsers = msg.readBy?.filter(r => {
                const readerId = String(r._id);
                return latestReadIndices[readerId] === index && currentUserId && readerId !== String(currentUserId);
              }) || [];

              // Sync avatar with participant state
              const senderParticipant = participants.find(p => p.userId === msg.sender?._id);
              const displayMessage = {
                ...msg,
                sender: msg.sender ? {
                  ...msg.sender,
                  avatar: senderParticipant?.avatar ?? msg.sender.avatar
                } : null
              };

              return (
                <MessageItem
                  key={msg._id}
                  message={displayMessage}
                  isMine={isMine}
                  conversationId={conversationId}
                  readByUsers={readByUsers}
                  onAvatarClick={onAvatarClick}
                />
              );
            });
          })()}

          {typingUsers.length > 0 && (
            <div className="flex items-center gap-3 mt-4 animate-fade-in-up">
              <div className="flex -space-x-2 mr-1 relative z-10">
                {typingUsers.map(userId => {
                  const participant = participants.find(p => p.userId === userId);
                  return (
                    <div key={userId} className="relative shadow-sm ring-2 ring-white rounded-full">
                      <ChatAvatar avatarUrl={participant?.avatar ?? null} fullName={participant?.fullName || 'U'} size={32} />
                    </div>
                  );
                })}
              </div>
              <div className="glass-panel px-4 py-3 rounded-3xl rounded-bl-sm flex gap-1.5 items-center">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      )}

      {showScrollBottomBtn && (
        <button
          onClick={() => scrollToBottom('smooth')}
          className="absolute bottom-24 right-8 z-30 p-3 bg-white/90 backdrop-blur-md border border-slate-200/80 text-indigo-600 hover:text-indigo-700 hover:bg-white rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_6px_24px_rgba(0,0,0,0.12)] transition-all duration-300 animate-bounce pointer-events-auto flex items-center justify-center"
          title="Cuộn xuống dưới"
        >
          <svg className="w-5 h-5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 13l-7 7-7-7m14-6l-7 7-7-7" />
          </svg>
        </button>
      )}

      <MessageInput 
        conversationId={conversationId} 
        disabledMessage={
          isLoading 
            ? "Đang tải tin nhắn..." 
            : (conversation?.isGroupChat && participants.length > 0 && participants.length < 3 
                ? "Nhóm đã bị đóng do không đủ thành viên" 
                : undefined)
        }
      />
    </div>
  );
};