import React, { useEffect, useState, useRef } from 'react';
import { AxiosError } from 'axios';
import { messageApi } from '../../api/message.api';
import type { Message } from '../../types/message.type';
import { useSocket } from '../../hooks/useSocket';
import { useAuthStore } from '../../store/auth.store';
import MessageInput from './MessageInput';
import { mapBackendMessage, mapBackendMessages, type BackendMessage } from '../../lib/messageMapper';
import { conversationApi, participantApi } from '../../api/conversation.api';
import type { GroupNote } from '../../types/group.type';
import type { ConversationParticipant } from '../../types/conversation.type';
import { MessageItem } from './MessageItem';
import { ChatAvatar } from '../ChatAvatar';

interface ChatWindowProps {
  conversationId: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ conversationId }) => {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string>('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [participants, setParticipants] = useState<ConversationParticipant[]>([]);
  const [latestNote, setLatestNote] = useState<GroupNote | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { onMessageReceived, onTyping, onStopTyping, onMessagesRead } = useSocket(conversationId);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setError('');
        const res = await messageApi.getMessages(conversationId.toString());
        setMessages(mapBackendMessages(res.data.data?.messages || []));
      } catch (err: unknown) {
        if (err instanceof AxiosError) {
          setError(err.response?.data?.message || 'Lỗi khi tải tin nhắn.');
        } else {
          setError('Lỗi không xác định khi tải tin nhắn.');
        }
      }
    };
    
    const fetchLatestNote = async () => {
      try {
        const res = await noteApi.getNotes(conversationId);
        const notes = (res.data as any).data || res.data || [];
        if (notes.length > 0) {
          setLatestNote(notes[notes.length - 1]);
        } else {
          setLatestNote(null);
        }
      } catch (err) {
        console.error('Failed to fetch notes', err);
      }
    };

    const fetchParticipants = async () => {
      try {
        const res = await participantApi.getParticipants(conversationId);
        const parts = (res.data as any).data || res.data || [];
        setParticipants(parts);
      } catch (err) {
        console.error('Failed to fetch participants', err);
      }
    };

    if (conversationId) {
      fetchMessages();
      fetchLatestNote();
      fetchParticipants();
    }
  }, [conversationId]);

  // Mark as read when new unread messages appear
  useEffect(() => {
    if (messages.length > 0 && user?._id) {
      const unreadExists = messages.some(msg => 
        msg.SenderId !== user._id && !msg.ReadBy?.some(r => r._id === user._id)
      );
      
      if (unreadExists) {
        conversationApi.markAsRead(conversationId).catch(console.error);
      }
    }
  }, [messages, conversationId, user]);

  useEffect(() => {
    const cleanup = onMessageReceived((newMessage: BackendMessage) => {
      const mappedMessage = mapBackendMessage(newMessage);
      if (mappedMessage.ConversationId === conversationId) {
        setMessages((prev) => {
          if (prev.some((msg) => msg.MessageId === mappedMessage.MessageId)) {
            return prev;
          }
          return [...prev, mappedMessage];
        });

        // Nếu có tin nhắn hệ thống báo hiệu ghi chú mới, cập nhật lại ghi chú
        if (mappedMessage.MessageType === 'system' && mappedMessage.Content.toLowerCase().includes('ghi chú')) {
          noteApi.getNotes(conversationId).then(res => {
            const notes = (res.data as any).data || res.data || [];
            if (notes.length > 0) {
              setLatestNote(notes[notes.length - 1]);
            }
          });
        }
      }
    });

    const cleanupRead = onMessagesRead(({ conversationId: eventRoomId, userId }) => {
      if (eventRoomId === conversationId) {
        // Tìm thông tin user đã đọc từ danh sách participants (nếu có thể)
        // Nếu không có, tạm thời để fullName là rỗng, avatar là null
        const participant = participants.find(p => (p.userId || p.UserId) === userId);
        const readerInfo = {
          _id: userId,
          fullName: participant?.fullName || '',
          avatar: null // avatar might be missing in participant data, ideally fetched or stored in state
        };

        setMessages((prev) => 
          prev.map(msg => {
            if (msg.SenderId !== userId && !msg.ReadBy?.some(r => r._id === userId)) {
              return { ...msg, ReadBy: [...(msg.ReadBy || []), readerInfo] };
            }
            return msg;
          })
        );
      }
    });

    return () => {
      cleanup();
      cleanupRead();
    };
  }, [conversationId, onMessageReceived, onMessagesRead, participants]);

  useEffect(() => {
    const cleanupTyping = onTyping((payload) => {
      if (payload.roomId === conversationId && payload.userId && payload.userId !== user?._id) {
        setTypingUsers(prev => {
          if (!prev.includes(payload.userId!)) return [...prev, payload.userId!];
          return prev;
        });
      }
    });

    const cleanupStopTyping = onStopTyping((payload) => {
      if (payload.roomId === conversationId && payload.userId) {
        setTypingUsers(prev => prev.filter(id => id !== payload.userId));
      }
    });

    return () => {
      cleanupTyping();
      cleanupStopTyping();
    };
  }, [conversationId, onTyping, onStopTyping, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="absolute inset-0 flex flex-col bg-transparent">
      {error && <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-red-100 text-red-600 px-4 py-2 rounded-full text-sm font-medium shadow-md border border-red-200">{error}</div>}

      {latestNote && (
        <div className="bg-amber-50/90 backdrop-blur-md border-b border-amber-200/60 px-4 py-2.5 flex items-start gap-3 shrink-0 shadow-sm z-10 transition-all animate-fade-in-up">
          <div className="bg-amber-100 text-amber-600 p-1.5 rounded-lg shrink-0 mt-0.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-[10px] font-bold text-amber-700/80 mb-0.5 uppercase tracking-wider">Ghi chú ghim</p>
            <p className="text-sm text-slate-700 line-clamp-2">{latestNote.Content}</p>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 sm:px-8 pt-4 pb-32 custom-scrollbar relative z-0">
        {(() => {
          const latestReadIndices: Record<string, number> = {};
          messages.forEach((msg, index) => {
            msg.ReadBy?.forEach(reader => {
              if (reader._id !== user?._id) {
                latestReadIndices[reader._id] = index;
              }
            });
          });

          return messages.map((msg, index) => {
            const isMine = msg.SenderId === user?._id;
            const readByUsers = msg.ReadBy?.filter(r => latestReadIndices[r._id] === index && r._id !== user?._id) || [];
            
            return (
              <MessageItem 
                key={msg.MessageId} 
                message={msg} 
                isMine={isMine} 
                conversationId={conversationId} 
                readByUsers={readByUsers}
              />
            );
          });
        })()}
        
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-3 mt-4 animate-fade-in-up">
            <div className="flex -space-x-2 mr-1 relative z-10">
              {typingUsers.map(userId => {
                const participant = participants.find(p => (p.userId || p.UserId) === userId);
                return (
                  <div key={userId} className="relative shadow-sm ring-2 ring-white rounded-full">
                    <ChatAvatar 
                      avatarUrl={null} 
                      fullName={participant?.fullName || 'U'} 
                      size={32} 
                    />
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

      <MessageInput conversationId={conversationId} />
    </div>
  );
};