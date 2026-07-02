import React, { useEffect, useState, useRef } from 'react';
import { AxiosError } from 'axios';
import { messageApi } from '../../api/message.api';
import type { Message } from '../../types/message.type';
import { useSocket } from '../../hooks/useSocket';
import { useAuthStore } from '../../store/auth.store';
import MessageInput from './MessageInput';
import { mapBackendMessage, mapBackendMessages, type BackendMessage } from '../../lib/messageMapper';
import { conversationApi, participantApi, noteApi } from '../../api/conversation.api';
import type { ConversationParticipant } from '../../types/conversation.type';
import { MessageItem } from './MessageItem';
import { ChatAvatar } from '../ChatAvatar';

interface ChatWindowProps {
  conversationId: string;
  conversation: any;
  onAvatarClick?: (userId: string) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ conversationId, conversation, onAvatarClick }) => {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string>('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [participants, setParticipants] = useState<ConversationParticipant[]>([]);
  const [latestNote, setLatestNote] = useState<any | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { onMessageReceived, onTyping, onStopTyping, onMessagesRead, onMessageUpdated, onMessageDeleted } = useSocket(conversationId);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setError('');
        const res = await messageApi.getMessages(conversationId.toString());
        setMessages(mapBackendMessages((res.data as any).data?.messages || []));
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
        setLatestNote(notes.length > 0 ? notes[notes.length - 1] : null);
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

  // Mark as read when messages load
  useEffect(() => {
    if (messages.length > 0 && user?._id) {
      const hasUnread = messages.some(msg =>
        msg.sender?._id !== user._id && !msg.readBy?.some(r => r._id === user._id)
      );
      if (hasUnread) {
        conversationApi.markAsRead(conversationId).catch(console.error);
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

        // Refresh notes if system message about notes
        if (mapped.messageType === 'system' && mapped.content?.toLowerCase().includes('ghi chú')) {
          noteApi.getNotes(conversationId).then(res => {
            const notes = (res.data as any).data || res.data || [];
            setLatestNote(notes.length > 0 ? notes[notes.length - 1] : null);
          });
        }
      }
    });

    const cleanupRead = onMessagesRead(({ conversationId: eventRoomId, userId }) => {
      if (eventRoomId === conversationId) {
        const participant = participants.find(p => p.userId === userId);
        const readerInfo = { _id: userId, fullName: participant?.fullName || '', avatar: participant?.avatar ?? null };
        setMessages(prev =>
          prev.map(msg => {
            if (msg.sender?._id !== userId && !msg.readBy?.some(r => r._id === userId)) {
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

    return () => { cleanup(); cleanupRead(); cleanupUpdated(); cleanupDeleted(); };
  }, [conversationId, onMessageReceived, onMessagesRead, onMessageUpdated, onMessageDeleted, participants]);

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="absolute inset-0 flex flex-col bg-transparent">
      {error && <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-red-100 text-red-600 px-4 py-2 rounded-full text-sm font-medium shadow-md border border-red-200">{error}</div>}

      {/* Pinned Note */}
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
          // Track latest read index per reader
          const latestReadIndices: Record<string, number> = {};
          messages.forEach((msg, index) => {
            msg.readBy?.forEach(reader => {
              if (reader._id !== user?._id) {
                latestReadIndices[reader._id] = index;
              }
            });
          });

          return messages.map((msg, index) => {
            const isMine = msg.sender?._id === user?._id;
            const readByUsers = msg.readBy?.filter(r => latestReadIndices[r._id] === index && r._id !== user?._id) || [];

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

      <MessageInput 
        conversationId={conversationId} 
        disabledMessage={conversation?.isGroupChat && participants.length > 0 && participants.length < 3 ? "Nhóm đã bị đóng do không đủ thành viên" : undefined}
      />
    </div>
  );
};