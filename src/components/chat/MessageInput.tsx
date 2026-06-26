import React, { useEffect, useRef, useState, useMemo } from 'react';
import { AxiosError } from 'axios';
import { useSocket } from '../../hooks/useSocket';
import { messageApi } from '../../api/message.api';
import { useAuthStore } from '../../store/auth.store';

interface MessageInputProps {
  conversationId: string;
}

const MessageInput: React.FC<MessageInputProps> = ({ conversationId }) => {
  const [content, setContent] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isSending, setIsSending] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingActiveRef = useRef(false);
  const stopTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const { sendRealtimeMessage, echo } = useSocket(conversationId);
  const { user } = useAuthStore();

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
    try {
      emitStopTyping();

      await messageApi.sendMessage(conversationId, content.trim(), file || undefined);
      
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.currentTarget.form?.requestSubmit();
    }
  };

  return (
    <div className="absolute bottom-6 left-0 right-0 px-4 md:px-8 pointer-events-none z-20">
      <form onSubmit={handleSend} className="max-w-4xl mx-auto flex items-end gap-3 p-2 bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.05)] rounded-3xl pointer-events-auto transition-all focus-within:shadow-[0_8px_32px_0_rgba(79,70,229,0.15)] focus-within:border-indigo-300 focus-within:bg-white/90">
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFile(e.target.files?.[0] || null)}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload" className={`cursor-pointer p-3.5 rounded-full transition-all self-end mb-0.5 ${file ? 'text-indigo-600 bg-indigo-100 shadow-inner' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/80'}`} title="Đính kèm file">
          <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
        </label>
        
        <div className="flex-1 flex flex-col justify-end bg-transparent rounded-2xl overflow-hidden mb-0.5">
          {file && (
            <div className="flex items-start gap-3 px-3 py-3 bg-indigo-50/60 border-b border-indigo-100/50 relative rounded-t-xl mx-2 mt-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0 text-indigo-600 shadow-sm">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-slate-700 truncate pr-6">{file.name}</p>
                <p className="text-[11px] text-slate-500 font-medium">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              
              <button 
                type="button" 
                onClick={() => setFile(null)} 
                disabled={isSending}
                className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          )}
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
            placeholder={file ? "Thêm ghi chú..." : "Nhập tin nhắn..."}
            className="w-full px-2 py-3 bg-transparent focus:outline-none text-[15px] placeholder:text-slate-400 font-medium disabled:opacity-50"
            disabled={isSending}
            autoComplete="off"
            onKeyDown={handleKeyDown}
          />
        </div>
        
        <button 
          type="submit" 
          disabled={isSending || (!content.trim() && !file)}
          className="p-3.5 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-full hover:from-indigo-700 hover:to-purple-700 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 transition-all shadow-md shadow-indigo-500/30 disabled:shadow-none self-end mb-0.5 shrink-0 active:scale-95"
          title="Gửi"
        >
          {isSending ? (
            <svg className="animate-spin w-[22px] h-[22px]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          ) : (
            <svg className="w-[22px] h-[22px] ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          )}
        </button>
      </form>
    </div>
  );
};

export default MessageInput;