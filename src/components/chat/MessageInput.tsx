import React, { useEffect, useRef, useState } from 'react';
import { AxiosError } from 'axios';
import { useSocket } from '../../hooks/useSocket';
import { messageApi } from '../../api/message.api';
import { useAuthStore } from '../../store/auth.store';
import { useToastStore } from '../../store/toast.store';

interface MessageInputProps {
  conversationId: string;
  disabledMessage?: string;
}

const MessageInput: React.FC<MessageInputProps> = ({ conversationId, disabledMessage }) => {
  const [content, setContent] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingActiveRef = useRef(false);
  const stopTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const { echo } = useSocket(conversationId);
  const { user } = useAuthStore();

  useEffect(() => {
    if (!file) {
      setImagePreviewUrl('');
      return;
    }

    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setImagePreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  const emitStopTyping = () => {
    if (!typingActiveRef.current) return;

    echo?.private(`chat.${conversationId}`).whisper('stop_typing', { userId: user?._id });
    typingActiveRef.current = false;
  };

  const emitTypingIfNeeded = () => {
    if (!typingActiveRef.current) {
      echo?.private(`chat.${conversationId}`).whisper('typing', { userId: user?._id });
      typingActiveRef.current = true;
    }

    if (stopTypingTimeoutRef.current) {
      clearTimeout(stopTypingTimeoutRef.current);
    }

    stopTypingTimeoutRef.current = setTimeout(() => {
      emitStopTyping();
    }, 1500);
  };

  useEffect(() => {
    return () => {
      if (stopTypingTimeoutRef.current) {
        clearTimeout(stopTypingTimeoutRef.current);
      }
      emitStopTyping();
    };
  }, [conversationId]);

  const handleSend = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if ((!content.trim() && !file) || isSending) return;

    setIsSending(true);
    setUploadProgress(0);
    try {
      emitStopTyping();

      await messageApi.sendMessage(
        conversationId, 
        content.trim(), 
        file || undefined,
        (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        }
      );
      
      setContent('');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        useToastStore.getState().error(err.response?.data?.message || 'Gửi tin nhắn thất bại.');
      } else {
        useToastStore.getState().error('Lỗi hệ thống khi gửi tin nhắn.');
      }
    } finally {
      setIsSending(false);
      setUploadProgress(0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.currentTarget.form?.requestSubmit();
    }
  };

  return (
    <div className="absolute bottom-6 left-0 right-0 px-4 md:px-8 pointer-events-none z-20">
      <div className="max-w-4xl mx-auto flex flex-col gap-3 pointer-events-auto">
        {file && (
          <div className="flex items-center gap-3.5 p-3 bg-white border border-slate-200 shadow-xl rounded-2xl mx-4 transition-all duration-300 ease-out transform scale-100 opacity-100 hover:scale-[1.01] relative max-w-sm self-start z-10">
            {/* Thumbnail or File Icon */}
            {imagePreviewUrl ? (
              <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-slate-100 shadow-sm relative">
                <img src={imagePreviewUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0 text-indigo-600 border border-indigo-100/50 shadow-sm">
                {file.type.startsWith('video/') ? (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                ) : file.type.startsWith('audio/') ? (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                )}
              </div>
            )}
            
            <div className="flex-1 min-w-0 pr-6">
              <p className="text-[13px] font-semibold text-slate-700 truncate" title={file.name}>{file.name}</p>
              <p className="text-[11px] text-slate-400 font-medium">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>

            {/* Remove button */}
            {!isSending && (
              <button 
                type="button" 
                onClick={() => {
                  setFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }} 
                className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                title="Xoá file"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}

            {/* Progress overlay when sending */}
            {isSending && (
              <div className="absolute inset-0 bg-white/90 backdrop-blur-[1px] rounded-2xl flex flex-col items-center justify-center px-4 py-2">
                <div className="w-full bg-slate-100 rounded-full h-1.5 mb-1.5 overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300 ease-out" 
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <span className="text-[11px] font-bold text-indigo-600">{uploadProgress}%</span>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSend} className="flex items-center gap-2 px-3 py-1.5 bg-[#f0f2f5] rounded-full transition-colors focus-within:bg-[#e4e6e9]">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFile(e.target.files?.[0] || null)}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className={`p-2 rounded-full transition-colors flex shrink-0 ${disabledMessage ? 'text-slate-300 cursor-not-allowed' : file ? 'text-indigo-600 bg-indigo-100 cursor-pointer' : 'text-slate-500 hover:bg-slate-200 hover:text-slate-700 cursor-pointer'}`} title="Đính kèm file">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
          </label>
          
          <div className="flex-1 flex flex-col justify-center bg-transparent min-w-0">
            <input
              type="text"
              value={content}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const nextValue = e.target.value;
                setContent(nextValue);

                if (nextValue.trim().length > 0) {
                  emitTypingIfNeeded();
                  return;
                }

                if (stopTypingTimeoutRef.current) {
                  clearTimeout(stopTypingTimeoutRef.current);
                }

                emitStopTyping();
              }}
              placeholder={disabledMessage || (file ? "Thêm ghi chú..." : "Nhập tin nhắn...")}
              className="w-full px-2 py-2 bg-transparent focus:outline-none text-[15px] text-slate-800 placeholder-slate-400 font-medium disabled:opacity-70"
              disabled={isSending || !!disabledMessage}
              autoComplete="off"
              onKeyDown={handleKeyDown}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={isSending || !!disabledMessage || (!content.trim() && !file)}
            className="p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-700 rounded-full disabled:opacity-50 disabled:hover:bg-transparent transition-colors flex shrink-0"
            title="Gửi"
          >
            {isSending ? (
              <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : (
              <svg className="w-5 h-5 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default MessageInput;