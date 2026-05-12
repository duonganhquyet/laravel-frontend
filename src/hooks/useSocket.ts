import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/auth.store';
import type { Message } from '../types/message.type';

const SOCKET_URL = 'http://localhost:5000';

export interface ParticipantUpdateData {
  ConversationId: number;
  UserId: number;
  Action: 'add' | 'remove' | 'leave';
  Role?: string;
}

export interface UseSocketReturn {
  socket: Socket | null;
  sendRealtimeMessage: (message: Message) => void;
  onMessageReceived: (callback: (msg: Message) => void) => void;
  onParticipantsUpdated: (callback: (data: ParticipantUpdateData) => void) => void;
}

export const useSocket = (activeConversationId?: number): UseSocketReturn => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { user } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Nếu không có user, không làm gì cả (tránh lỗi ngầm định)
    if (!user) return;

    const newSocket = io(SOCKET_URL, {
      query: { UserId: user.UserId }
    });

    // 1. Gán vào Ref ngay lập tức (đồng bộ) để dùng nội bộ, không gây render
    socketRef.current = newSocket;

    // 2. CÁCH FIX LỖI: Đưa setSocket vào callback của sự kiện kết nối
    // Component sẽ chỉ re-render khi kết nối socket thực sự thành công
    newSocket.on('connect', () => {
      setSocket(newSocket);
    });

    newSocket.emit('setup', user);

    // Cleanup khi component unmount hoặc user thay đổi
    return () => {
      newSocket.disconnect();
      socketRef.current = null;
      setSocket(null); 
    };
  }, [user]);

  // Tham gia vào phòng trò chuyện
  useEffect(() => {
    if (socket && activeConversationId) {
      socket.emit('join_conversation', activeConversationId);
    }
  }, [socket, activeConversationId]);

  // --- Các hàm thao tác (bọc trong useCallback để không thay đổi reference) ---
  const sendRealtimeMessage = useCallback((message: Message) => {
    socketRef.current?.emit('new_message', message);
  }, []);

  const onMessageReceived = useCallback((callback: (msg: Message) => void) => {
    const currentSocket = socketRef.current;
    if (!currentSocket) return;

    currentSocket.off('message_received'); 
    currentSocket.on('message_received', callback);
  }, []);

  const onParticipantsUpdated = useCallback((callback: (data: ParticipantUpdateData) => void) => {
    const currentSocket = socketRef.current;
    if (!currentSocket) return;

    currentSocket.off('participants_updated');
    currentSocket.on('participants_updated', callback);
  }, []);

  return {
    socket,
    sendRealtimeMessage,
    onMessageReceived,
    onParticipantsUpdated
  };
};