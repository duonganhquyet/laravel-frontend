import React, { useState, useRef } from 'react';
import { AxiosError } from 'axios';
import { messageApi } from '../../api/message.api';
import { useSocket } from '../../hooks/useSocket';
import './MessageInput.css'

interface MessageInputProps {
  conversationId: number;
}

const MessageInput: React.FC<MessageInputProps> = ({ conversationId }) => {
  const [content, setContent] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [isSending, setIsSending] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { sendRealtimeMessage } = useSocket(conversationId);

  const handleSend = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if ((!content.trim() && !file) || isSending) return;

    setIsSending(true);
    try {
      const res = await messageApi.sendMessage(conversationId, content, file || undefined);
      
      sendRealtimeMessage(res.data);
      
      setContent('');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        alert(err.response?.data?.message || 'Gửi tin nhắn thất bại.');
      } else {
        alert('Lỗi hệ thống khi gửi tin nhắn.');
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form onSubmit={handleSend} className="p-4 bg-white border-t flex items-center gap-2">
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFile(e.target.files?.[0] || null)}
        className="hidden"
        id="file-upload"
      />
      <label htmlFor="file-upload" className="cursor-pointer p-2 text-gray-500 hover:text-blue-500">
        📎
      </label>
      
      {file && <span className="text-xs truncate max-w-[100px] text-blue-500">{file.name}</span>}
      
      <input
        type="text"
        value={content}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setContent(e.target.value)}
        placeholder="Nhập tin nhắn..."
        className="flex-1 p-2 border rounded-full focus:outline-none focus:border-blue-500"
        disabled={isSending}
      />
      
      <button 
        type="submit" 
        disabled={isSending}
        className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 disabled:bg-blue-300"
      >
        Gửi
      </button>
    </form>
  );
};

export default MessageInput;