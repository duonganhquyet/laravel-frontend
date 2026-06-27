import { useEffect, useRef, useState, useCallback } from 'react';
import { initEcho, getEcho } from '../lib/socket';
import { useAuthStore } from '../store/auth.store';
import type { Message } from '../types/message.type';
import type { BackendMessage } from '../lib/messageMapper';
import Echo from 'laravel-echo';

export interface ParticipantUpdateData {
  ConversationId: string;
  UserId: string;
  Action: 'add' | 'remove' | 'leave';
  Role?: string;
}

export interface UseSocketReturn {
  echo: Echo | null;
  sendRealtimeMessage: (message: Message) => void;
  onMessageReceived: (callback: (msg: BackendMessage) => void) => () => void;
  onMessageUpdated: (callback: (msg: BackendMessage) => void) => () => void;
  onMessageDeleted: (callback: (msg: BackendMessage) => void) => () => void;
  onTyping: (callback: (payload: { roomId: string; fromSocketId: string; userId?: string }) => void) => () => void;
  onStopTyping: (callback: (payload: { roomId: string; fromSocketId: string; userId?: string }) => void) => () => void;
  onMessagesRead: (callback: (payload: { conversationId: string; userId: string }) => void) => () => void;
  onParticipantsUpdated: (callback: (data: ParticipantUpdateData) => void) => () => void;
  onEvent: (eventName: string, callback: (...args: any[]) => void) => () => void;
}

export const useSocket = (activeConversationId?: string): UseSocketReturn => {
  const [echo, setEcho] = useState<Echo | null>(null);
  const { user } = useAuthStore();
  const echoRef = useRef<Echo | null>(null);

  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('token');
    const instance = initEcho(token);
    echoRef.current = instance;
    setEcho(instance);

    return () => {
      if (instance) {
        instance.disconnect();
      }
      echoRef.current = null;
      setEcho(null);
    };
  }, [user]);

  useEffect(() => {
    if (!echo || !activeConversationId) return;

    // Join the channel
    const channel = echo.private(`chat.${activeConversationId}`);

    return () => {
      echo.leave(`chat.${activeConversationId}`);
    };
  }, [echo, activeConversationId]);

  const sendRealtimeMessage = useCallback((message: Message) => {
    // In Laravel Reverb, sending is usually done via HTTP and broadcasted back.
    // If you need client-to-client events, use whisper.
    // We assume backend handles the broadcast when a message is sent via API.
  }, []);

  const onMessageReceived = useCallback((callback: (msg: BackendMessage) => void) => {
    if (!echo || !activeConversationId) return () => {};

    const channel = echo.private(`chat.${activeConversationId}`);
    channel.listen('.message.sent', (payload: any) => {
      callback(payload.message);
    });

    return () => {
      channel.stopListening('.message.sent');
    };
  }, [echo, activeConversationId]);

  const onMessageUpdated = useCallback((callback: (msg: BackendMessage) => void) => {
    if (!echo || !activeConversationId) return () => {};

    const channel = echo.private(`chat.${activeConversationId}`);
    channel.listen('.message.updated', (payload: any) => {
      callback(payload.message);
    });

    return () => {
      channel.stopListening('.message.updated');
    };
  }, [echo, activeConversationId]);

  const onMessageDeleted = useCallback((callback: (msg: BackendMessage) => void) => {
    if (!echo || !activeConversationId) return () => {};

    const channel = echo.private(`chat.${activeConversationId}`);
    channel.listen('.message.deleted', (payload: any) => {
      callback(payload.message);
    });

    return () => {
      channel.stopListening('.message.deleted');
    };
  }, [echo, activeConversationId]);

  const onTyping = useCallback((callback: (payload: { roomId: string; fromSocketId: string; userId?: string }) => void) => {
    if (!echo || !activeConversationId) return () => {};

    const channel = echo.private(`chat.${activeConversationId}`);
    channel.listenForWhisper('typing', (e: any) => {
      callback({ roomId: activeConversationId, fromSocketId: '', userId: e.userId });
    });

    return () => {
      // whisper listener cleanup handled by leave channel
    };
  }, [echo, activeConversationId]);

  const onStopTyping = useCallback((callback: (payload: { roomId: string; fromSocketId: string; userId?: string }) => void) => {
    if (!echo || !activeConversationId) return () => {};

    const channel = echo.private(`chat.${activeConversationId}`);
    channel.listenForWhisper('stop_typing', (e: any) => {
      callback({ roomId: activeConversationId, fromSocketId: '', userId: e.userId });
    });

    return () => {};
  }, [echo, activeConversationId]);

  const onMessagesRead = useCallback((callback: (payload: { conversationId: string; userId: string }) => void) => {
    if (!echo || !activeConversationId) return () => {};

    const channel = echo.private(`chat.${activeConversationId}`);
    channel.listen('.messages.read', (payload: any) => {
      callback(payload);
    });

    return () => channel.stopListening('.messages.read');
  }, [echo, activeConversationId]);

  const onParticipantsUpdated = useCallback((callback: (data: ParticipantUpdateData) => void) => {
    if (!echo || !activeConversationId) return () => {};

    const channel = echo.private(`chat.${activeConversationId}`);
    channel.listen('.participants.updated', (payload: any) => {
      callback(payload);
    });

    return () => channel.stopListening('.participants.updated');
  }, [echo, activeConversationId]);

  const onEvent = useCallback((eventName: string, callback: (...args: any[]) => void) => {
    if (!echo || !user) return () => {};
    
    const channel = echo.private(`user.${user.id}`);
    channel.listen(`.${eventName}`, (payload: any) => {
      callback(payload);
    });

    return () => {
      channel.stopListening(`.${eventName}`);
    };
  }, [echo, user]);

  return {
    echo,
    sendRealtimeMessage,
    onMessageReceived,
    onMessageUpdated,
    onMessageDeleted,
    onTyping,
    onStopTyping,
    onMessagesRead,
    onParticipantsUpdated,
    onEvent,
  };
};