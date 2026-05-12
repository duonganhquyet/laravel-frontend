import React, { useEffect, useState, useRef } from 'react';
import { AxiosError } from 'axios';
import { messageApi } from '../../api/message.api';
import type { Message } from '../../types/message.type';
import { useSocket } from '../../hooks/useSocket';
import { useAuthStore } from '../../store/auth.store';
import MessageInput from './MessageInput';
import './ChatMess.css'

interface ChatWindowProps {
  conversationId: number;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ conversationId }) => {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { onMessageReceived } = useSocket(conversationId);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setError('');
        const res = await messageApi.getMessages(conversationId);
        setMessages(res.data);
      } catch (err: unknown) {
        if (err instanceof AxiosError) {
          setError(err.response?.data?.message || 'Lỗi khi tải tin nhắn.');
        } else {
          setError('Lỗi không xác định khi tải tin nhắn.');
        }
      }
    };
    if (conversationId) fetchMessages();
  }, [conversationId]);

  useEffect(() => {
    onMessageReceived((newMessage: Message) => {
      if (newMessage.ConversationId === conversationId) {
        setMessages((prev) => [...prev, newMessage]);
      }
    });
  }, [conversationId, onMessageReceived]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-gray-50 relative">
      {error && <div className="absolute top-0 left-0 right-0 bg-red-100 text-red-600 p-2 text-center text-sm">{error}</div>}
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isMine = msg.SenderId === user?.UserId;
          return (
            <div key={msg.MessageId} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] p-3 rounded-lg ${isMine ? 'bg-blue-500 text-white rounded-br-none' : 'bg-white border rounded-bl-none'}`}>
                {msg.MessageType === 'image' && msg.FileName && (
                  <img src={msg.FileName} alt="attachment" className="max-w-full h-auto rounded mb-2" />
                )}
                {msg.MessageType === 'file' && msg.FileName && (
                  <a href={msg.FileName} target="_blank" rel="noreferrer" className="underline mb-2 block">
                    Tải file đính kèm
                  </a>
                )}
                <p>{msg.Content}</p>
                <span className="text-xs opacity-70 mt-1 block text-right">
                  {new Date(msg.CreatedAt).toLocaleTimeString()}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      
      <MessageInput conversationId={conversationId} />
    </div>
  );
};