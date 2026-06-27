import React, { useState } from 'react';
import type { Message } from '../../types/message.type';
import { PollMessageItem } from './PollMessageItem';
import { NoteMessageItem } from './NoteMessageItem';
import { messageApi } from '../../api/message.api';
import { ChatAvatar } from '../ChatAvatar';

interface MessageItemProps {
  message: Message;
  isMine: boolean;
  conversationId?: string;
  readByUsers?: { _id: string; fullName: string; avatar: string | null }[];
}

export const MessageItem: React.FC<MessageItemProps> = ({ message, isMine, conversationId, readByUsers = [] }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.Content || '');
  const [showMenu, setShowMenu] = useState(false);

  if (message.MessageType === 'system') {
    return (
      <div className="w-full flex justify-center my-3 animate-fade-in-up">
        <span className="bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full text-[12px] font-medium border border-emerald-100 shadow-sm">
          {message.Content}
        </span>
      </div>
    );
  }

  if (message.MessageType === 'poll') {
    return <PollMessageItem pollId={message.Content} conversationId={conversationId || ''} />;
  }

  if (message.MessageType === 'note') {
    return <NoteMessageItem noteId={message.Content} conversationId={conversationId || ''} />;
  }

  const handleRecall = async () => {
    if (window.confirm('Bạn có chắc chắn muốn thu hồi tin nhắn này?')) {
      try {
        await messageApi.recallMessage(message.MessageId);
        setShowMenu(false);
      } catch (err) {
        console.error('Failed to recall message', err);
      }
    }
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim() || editContent === message.Content) {
      setIsEditing(false);
      return;
    }
    try {
      await messageApi.editMessage(message.MessageId, editContent);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to edit message', err);
    }
  };

  const isDeleted = message.isDeletedForAll;

  return (
    <div className={`flex w-full mb-6 group animate-fade-in-up ${isMine ? 'justify-end' : 'justify-start'}`}>
      {!isMine && (
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex shrink-0 items-center justify-center text-white text-sm font-bold mr-3 mt-auto shadow-md shadow-indigo-500/20 overflow-hidden ring-2 ring-white">
          {message.Sender?.avatar ? (
            <img src={message.Sender.avatar} alt={message.Sender.fullName} className="w-full h-full object-cover" />
          ) : (
            message.Sender?.fullName ? message.Sender.fullName[0].toUpperCase() : 'U'
          )}
        </div>
      )}
      
      <div className={`relative max-w-[75%] sm:max-w-[65%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
        <span className={`text-[11px] text-slate-500 mb-1.5 px-1 font-semibold ${isMine ? 'text-right' : 'text-left'}`}>
          {message.Sender?.fullName || 'Người dùng'}
        </span>
        
        <div className="relative flex items-center group/menu">
          {isMine && !isDeleted && (
            <div className={`absolute top-1/2 -translate-y-1/2 ${isMine ? 'right-full mr-2' : 'left-full ml-2'} opacity-0 group-hover/menu:opacity-100 transition-opacity`}>
              <div className="relative">
                <button 
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors focus:outline-none"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" /></svg>
                </button>
                {showMenu && (
                  <div className="absolute right-0 bottom-full mb-1 w-32 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-10 animate-fade-in-up">
                    {message.MessageType === 'text' && (
                      <button 
                        onClick={() => { setIsEditing(true); setShowMenu(false); }}
                        className="w-full text-left px-4 py-2 text-[13px] text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        Chỉnh sửa
                      </button>
                    )}
                    <button 
                      onClick={handleRecall}
                      className="w-full text-left px-4 py-2 text-[13px] text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      Thu hồi
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className={`p-4 shadow-sm relative ${
            isDeleted 
              ? 'bg-slate-100/80 border border-slate-200 text-slate-500 rounded-3xl rounded-bl-sm italic'
              : isMine 
                ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-3xl rounded-br-sm shadow-indigo-500/30 shadow-lg border border-indigo-500/50' 
                : 'bg-white/80 backdrop-blur-md border border-white/60 text-slate-800 rounded-3xl rounded-bl-sm shadow-lg shadow-slate-200/50'
          }`}>
            
            {isDeleted ? (
              <div className="flex items-center gap-2 text-[13px]">
                <svg className="w-4 h-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                {message.Content}
              </div>
            ) : (
              <>
                {message.MessageType === 'image' && message.FileUrl && (
                  <div className="mb-2 overflow-hidden rounded-2xl border border-black/5 shadow-sm">
                    <img src={message.FileUrl} alt="Đính kèm" className="max-w-full h-auto object-cover max-h-[300px]" loading="lazy" />
                  </div>
                )}
                
                {message.MessageType === 'video' && message.FileUrl && (
                  <div className="mb-2 overflow-hidden rounded-2xl border border-black/5 bg-black/10 shadow-sm">
                    <video src={message.FileUrl} controls className="max-w-full h-auto max-h-[300px]" />
                  </div>
                )}
                
                {message.MessageType === 'file' && message.FileUrl && (
                  <a 
                    href={message.FileUrl} 
                    target="_blank" 
                    rel="noreferrer" 
                    className={`flex items-center gap-3 p-3 mb-2 rounded-2xl transition-colors ${
                      isMine ? 'bg-white/20 hover:bg-white/30 text-white border border-white/10' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/60'
                    }`}
                  >
                    <div className={`p-2 rounded-xl flex items-center justify-center ${isMine ? 'bg-white/20' : 'bg-indigo-100 text-indigo-600'}`}>
                      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="truncate text-[15px] font-semibold">{message.FileName || 'Tải file đính kèm'}</span>
                      {message.FileSize && <span className="text-[11px] opacity-80 mt-0.5">{(message.FileSize / 1024 / 1024).toFixed(2)} MB</span>}
                    </div>
                  </a>
                )}
                
                {/* Nội dung text */}
                {isEditing ? (
                  <div className="flex flex-col gap-2 mt-1 min-w-[200px]">
                    <textarea 
                      autoFocus
                      className={`w-full bg-black/10 border-none rounded-lg p-2 text-[14px] focus:ring-2 focus:ring-white/50 resize-none ${isMine ? 'text-white placeholder-white/60' : 'text-slate-800'}`}
                      rows={2}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSaveEdit();
                        } else if (e.key === 'Escape') {
                          setIsEditing(false);
                          setEditContent(message.Content || '');
                        }
                      }}
                    />
                    <div className="flex justify-end gap-2">
                      <button onClick={() => { setIsEditing(false); setEditContent(message.Content || ''); }} className="text-[11px] px-2 py-1 bg-white/20 hover:bg-white/30 rounded-md transition-colors">Hủy</button>
                      <button onClick={handleSaveEdit} className="text-[11px] px-2 py-1 bg-white hover:bg-slate-100 text-indigo-600 font-semibold rounded-md transition-colors">Lưu</button>
                    </div>
                  </div>
                ) : (
                  message.Content && <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed tracking-wide">{message.Content}</p>
                )}
              </>
            )}
          </div>
        </div>
        
        {/* Thời gian và Trạng thái */}
        <div className={`flex items-center gap-2 mt-2 px-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
          <span className={`text-[10px] font-bold ${
            isMine ? 'text-indigo-400/80' : 'text-slate-400'
          }`}>
            {new Date(message.CreatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          
          {/* Read Receipts for My Messages */}
          {isMine && !isDeleted && (
            <div className="flex items-center">
              {readByUsers.length > 0 ? (
                <div className="flex -space-x-1.5 opacity-90 transition-all hover:opacity-100 cursor-pointer">
                  {readByUsers.slice(0, 3).map(user => (
                    <div key={user._id} className="relative z-10 ring-1 ring-white rounded-full bg-white shadow-sm" title={`Đã xem bởi ${user.fullName}`}>
                      <ChatAvatar avatarUrl={user.avatar} fullName={user.fullName} size={14} />
                    </div>
                  ))}
                  {readByUsers.length > 3 && (
                    <div className="relative z-0 w-[14px] h-[14px] rounded-full bg-slate-200 ring-1 ring-white flex items-center justify-center text-[7px] font-bold text-slate-600 shadow-sm">
                      +{readByUsers.length - 3}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-indigo-300" title="Đã gửi">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {isMine && (
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex shrink-0 items-center justify-center text-white text-sm font-bold ml-3 mt-auto shadow-md shadow-indigo-500/20 overflow-hidden ring-2 ring-white">
          {message.Sender?.avatar ? (
            <img src={message.Sender.avatar} alt={message.Sender.fullName} className="w-full h-full object-cover" />
          ) : (
            message.Sender?.fullName ? message.Sender.fullName[0].toUpperCase() : 'U'
          )}
        </div>
      )}
    </div>
  );
};