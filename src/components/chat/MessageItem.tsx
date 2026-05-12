import React from 'react';
import type { Message } from '../../types/message.type';
import './ChatMess.css';

interface MessageItemProps {
  message: Message;
  isMine: boolean;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message, isMine }) => {
  return (
    <div className={`flex w-full mb-4 ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[70%] p-3 rounded-lg shadow-sm ${
        isMine ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border text-gray-800 rounded-bl-none'
      }`}>
        {/* Render Hình ảnh */}
        {message.MessageType === 'image' && message.FileName && (
          <img src={message.FileName} alt="Đính kèm" className="max-w-full h-auto rounded mb-2 object-cover" />
        )}
        
        {/* Render File */}
        {message.MessageType === 'file' && message.FileName && (
          <a 
            href={message.FileName} 
            target="_blank" 
            rel="noreferrer" 
            className="flex items-center gap-2 mb-2 p-2 bg-black bg-opacity-10 rounded hover:bg-opacity-20 transition"
          >
            📄 <span className="truncate underline text-sm">Tải file đính kèm</span>
          </a>
        )}
        
        {/* Nội dung text */}
        {message.Content && <p className="whitespace-pre-wrap word-break">{message.Content}</p>}
        
        {/* Thời gian */}
        <span className={`text-[10px] block mt-1 ${isMine ? 'text-blue-100 text-right' : 'text-gray-400 text-left'}`}>
          {new Date(message.CreatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};