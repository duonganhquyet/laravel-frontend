import React, { useState, useRef } from 'react';
import type { Message } from '../../types/message.type';
import { PollMessageItem } from './PollMessageItem';
import { useConfirmStore } from '../../store/confirm.store';
import { NoteMessageItem } from './NoteMessageItem';
import { messageApi } from '../../api/message.api';
import { ChatAvatar } from '../ChatAvatar';
import { MediaPreviewModal } from './MediaPreviewModal';

interface AudioMessagePlayerProps {
  fileUrl: string;
  isMine: boolean;
}

const AudioMessagePlayer: React.FC<AudioMessagePlayerProps> = ({ fileUrl, isMine }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(err => console.error("Error playing audio:", err));
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setCurrentTime(value);
    if (audioRef.current) {
      audioRef.current.currentTime = value;
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex items-center gap-3.5 py-1 px-1 min-w-[240px] select-none" onClick={(e) => e.stopPropagation()}>
      <audio 
        ref={audioRef} 
        src={fileUrl} 
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleAudioEnded}
        preload="metadata"
      />
      
      <button 
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-md transition-all active:scale-95 ${
          isMine 
            ? 'bg-white text-indigo-600 hover:bg-slate-100' 
            : 'bg-indigo-600 text-white hover:bg-indigo-700'
        }`}
      >
        {isPlaying ? (
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
        ) : (
          <svg className="w-4 h-4 fill-current ml-0.5" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        )}
      </button>

      <div className="flex-1 flex flex-col gap-1">
        <input 
          type="range" 
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={handleProgressChange}
          className={`w-full h-1 rounded-lg appearance-none cursor-pointer outline-none transition-all ${
            isMine 
              ? 'bg-white/30 accent-white' 
              : 'bg-slate-200 accent-indigo-600'
          }`}
        />
        <div className={`flex justify-between text-[10px] font-medium ${
          isMine ? 'text-white/80' : 'text-slate-400'
        }`}>
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};

const isAudioMessage = (message: Message) => {
  if (!message.fileUrl) return false;
  if (message.mimeType?.startsWith('audio/')) return true;
  if (message.fileName === 'voice-message.webm') return true;
  const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.wma', '.aac', '.amr'];
  const name = message.fileName?.toLowerCase() || '';
  return audioExtensions.some(ext => name.endsWith(ext));
};

interface MessageItemProps {
  message: Message;
  isMine: boolean;
  conversationId?: string;
  readByUsers?: { _id: string; fullName: string; avatar: string | null }[];
  onAvatarClick?: (userId: string) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message, isMine, conversationId, readByUsers = [], onAvatarClick }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content || '');
  const [showMenu, setShowMenu] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<{ url: string; type: 'image' | 'video' | 'file'; name: string } | null>(null);

  const handleDownload = async (e: React.MouseEvent, url: string, fileName: string) => {
    e.stopPropagation();
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = fileName || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error('Download failed', error);
      window.open(url, '_blank');
    }
  };

  if (message.messageType === 'system') {
    return (
      <div className="w-full flex justify-center my-3 animate-fade-in-up">
        <span className="bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full text-[12px] font-medium border border-emerald-100 shadow-sm">
          {message.content}
        </span>
      </div>
    );
  }

  if (message.messageType === 'poll') {
    return <PollMessageItem pollId={message.content} conversationId={conversationId || ''} />;
  }

  if (message.messageType === 'note') {
    return <NoteMessageItem noteId={message.content} conversationId={conversationId || ''} />;
  }

  const handleRecall = async () => {
    const confirmed = await useConfirmStore.getState().show({
      title: 'Thu hồi tin nhắn',
      message: 'Bạn có chắc chắn muốn thu hồi tin nhắn này?',
      confirmText: 'Thu hồi',
    });
    if (confirmed) {
      try {
        await messageApi.recallMessage(message._id);
        setShowMenu(false);
      } catch (err) {
        console.error('Failed to recall message', err);
      }
    }
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim() || editContent === message.content) {
      setIsEditing(false);
      return;
    }
    try {
      await messageApi.editMessage(message._id, editContent);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to edit message', err);
    }
  };

  const isDeleted = message.isDeletedForAll;
  const isEdited = !isDeleted && message.messageType === 'text' && 
    message.updatedAt && message.createdAt && 
    (new Date(message.updatedAt).getTime() - new Date(message.createdAt).getTime() > 1000);

  return (
    <div className={`flex w-full mb-6 group animate-fade-in-up ${isMine ? 'justify-end' : 'justify-start'}`}>
      {!isMine && (
        <div 
          onClick={() => { if (onAvatarClick && message.sender?._id) onAvatarClick(message.sender._id); }}
          className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex shrink-0 items-center justify-center text-white text-sm font-bold mr-3 mt-auto shadow-md shadow-indigo-500/20 overflow-hidden ring-2 ring-white cursor-pointer hover:ring-indigo-300 transition-all"
          title="Xem trang cá nhân"
        >
          {message.sender?.avatar ? (
            <img src={message.sender.avatar} alt={message.sender.fullName} className="w-full h-full object-cover" />
          ) : (
            message.sender?.fullName ? message.sender.fullName[0].toUpperCase() : 'U'
          )}
        </div>
      )}

      <div className={`relative max-w-[75%] sm:max-w-[65%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
        <span className={`text-[11px] text-slate-500 mb-1.5 px-1 font-semibold flex items-center gap-1.5 ${isMine ? 'flex-row-reverse text-right' : 'text-left'}`}>
          <span>{message.sender?.fullName || 'Người dùng'}</span>
          {isEdited && (
            <span className="text-[10px] text-slate-400 font-normal italic select-none" title="Tin nhắn đã chỉnh sửa">
              (đã chỉnh sửa)
            </span>
          )}
        </span>

        <div className="relative flex items-center group/menu">
          {isMine && !isDeleted && (
            <div className={`absolute top-1/2 -translate-y-1/2 ${isMine ? 'right-full mr-2' : 'left-full ml-2'} opacity-0 group-hover/menu:opacity-100 transition-opacity flex items-center gap-1`}>
              {message.fileUrl && (
                <button
                  onClick={(e) => handleDownload(e, message.fileUrl!, message.fileName || 'file')}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors focus:outline-none"
                  title="Tải xuống"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                </button>
              )}
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors focus:outline-none"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" /></svg>
                </button>
                {showMenu && (
                  <div className="absolute right-0 bottom-full mb-1 w-32 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-10 animate-fade-in-up">
                    {message.messageType === 'text' && (
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

          <div className={`shadow-sm relative ${
            isDeleted
              ? 'p-3 px-5 bg-white border border-slate-200 text-slate-400 rounded-3xl rounded-br-sm italic'
              : (message.messageType === 'image' || message.messageType === 'video') && !isAudioMessage(message)
                ? 'p-1 bg-transparent rounded-3xl'
                : isMine
                  ? `${isAudioMessage(message) ? 'p-2 px-3' : 'p-3 px-4'} bg-[#5b45ff] text-white rounded-[24px] rounded-br-sm`
                  : `${isAudioMessage(message) ? 'p-2 px-3' : 'p-3 px-4'} bg-white border border-slate-100 text-slate-800 rounded-[24px] rounded-bl-sm`
          }`}>
            {isDeleted ? (
              <div className="flex items-center gap-2 text-[14px]">
                <svg className="w-4 h-4 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                {message.content}
              </div>
            ) : (
              <>
                {isAudioMessage(message) && message.fileUrl ? (
                  <AudioMessagePlayer fileUrl={message.fileUrl} isMine={isMine} />
                ) : (
                  <>
                    {message.messageType === 'image' && message.fileUrl && (
                      <div 
                        className="overflow-hidden rounded-2xl border border-black/5 shadow-sm cursor-pointer relative group/media"
                        onClick={() => setPreviewMedia({ url: message.fileUrl!, type: 'image', name: message.fileName || 'image' })}
                      >
                        <img src={message.fileUrl} alt="Đính kèm" className="max-w-full h-auto object-cover max-h-[300px]" loading="lazy" />
                      </div>
                    )}
                    {message.messageType === 'video' && message.fileUrl && (
                      <div 
                        className="overflow-hidden rounded-2xl border border-black/5 bg-black/10 shadow-sm relative group/media"
                      >
                        <video src={message.fileUrl} controls className="max-w-full h-auto max-h-[300px]" />
                        <button
                          onClick={() => setPreviewMedia({ url: message.fileUrl!, type: 'video', name: message.fileName || 'video' })}
                          className="absolute top-2 left-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover/media:opacity-100 transition-opacity hover:bg-black/70 z-10"
                          title="Xem toàn màn hình"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                        </button>
                      </div>
                    )}
                    {message.messageType === 'file' && message.fileUrl && (
                      <div
                        onClick={() => setPreviewMedia({ url: message.fileUrl!, type: 'file', name: message.fileName || 'file' })}
                        className="flex items-center gap-3 cursor-pointer group min-w-[200px]"
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isMine ? 'bg-white/20' : 'bg-indigo-50 text-indigo-500'}`}>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                        </div>
                        <div className="flex flex-col overflow-hidden max-w-[200px]">
                          <span className={`truncate text-[14px] font-medium group-hover:underline ${isMine ? 'text-white' : 'text-slate-800'}`}>{message.fileName || 'Tải file đính kèm'}</span>
                          {message.fileSize && <span className={`text-[11px] mt-0.5 ${isMine ? 'text-white/70' : 'text-slate-400'}`}>{(message.fileSize / 1024 / 1024).toFixed(2)} MB</span>}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {isEditing ? (
                  <div className="flex flex-col gap-2 mt-1 min-w-[200px]">
                    <textarea
                      autoFocus
                      className={`w-full bg-black/10 border-none rounded-lg p-2 text-[14px] focus:ring-2 focus:ring-white/50 resize-none ${isMine ? 'text-white placeholder-white/60' : 'text-slate-800'}`}
                      rows={2}
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSaveEdit(); }
                        else if (e.key === 'Escape') { setIsEditing(false); setEditContent(message.content || ''); }
                      }}
                    />
                    <div className="flex justify-end gap-2">
                      <button onClick={() => { setIsEditing(false); setEditContent(message.content || ''); }} className="text-[11px] px-2 py-1 bg-white/20 hover:bg-white/30 rounded-md transition-colors">Hủy</button>
                      <button onClick={handleSaveEdit} className="text-[11px] px-2 py-1 bg-white hover:bg-slate-100 text-indigo-600 font-semibold rounded-md transition-colors">Lưu</button>
                    </div>
                  </div>
                ) : (
                  message.content && <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed tracking-wide">{message.content}</p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Time & Read Receipts */}
        <div className={`flex items-center gap-2 mt-1 px-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
          <span className={`text-[11px] font-medium ${isMine ? 'text-slate-400' : 'text-slate-400'}`}>
            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {isMine && !isDeleted && (
            <div className="flex items-center">
              {readByUsers.length > 0 ? (
                <div className="flex -space-x-1.5 opacity-90 transition-all hover:opacity-100 cursor-pointer">
                  {readByUsers.slice(0, 3).map(u => (
                    <div key={u._id} className="relative z-10 ring-1 ring-white rounded-full bg-white shadow-sm" title={`Đã xem bởi ${u.fullName}`}>
                      <ChatAvatar avatarUrl={u.avatar} fullName={u.fullName} size={14} />
                    </div>
                  ))}
                  {readByUsers.length > 3 && (
                    <div className="relative z-0 w-[14px] h-[14px] rounded-full bg-slate-200 ring-1 ring-white flex items-center justify-center text-[7px] font-bold text-slate-600 shadow-sm">
                      +{readByUsers.length - 3}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-[#5b45ff]/80" title="Đã gửi">
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
        <div 
          onClick={() => { if (onAvatarClick && message.sender?._id) onAvatarClick(message.sender._id); }}
          className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex shrink-0 items-center justify-center text-white text-sm font-bold ml-3 mt-auto shadow-md shadow-indigo-500/20 overflow-hidden ring-2 ring-white cursor-pointer hover:ring-indigo-300 transition-all"
          title="Xem trang cá nhân"
        >
          {message.sender?.avatar ? (
            <img src={message.sender.avatar} alt={message.sender.fullName} className="w-full h-full object-cover" />
          ) : (
            message.sender?.fullName ? message.sender.fullName[0].toUpperCase() : 'U'
          )}
        </div>
      )}

      {previewMedia && (
        <MediaPreviewModal
          isOpen={true}
          onClose={() => setPreviewMedia(null)}
          mediaUrl={previewMedia.url}
          mediaType={previewMedia.type}
          fileName={previewMedia.name}
        />
      )}
    </div>
  );
};