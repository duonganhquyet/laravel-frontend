import React, { useState, useEffect, useRef } from "react";
import type { Message } from "../../types/message.type";
import { messageApi } from "../../api/message.api";
import { mapBackendMessage } from "../../lib/messageMapper";

interface MessageSearchProps {
  conversationId: string;
  onClose: () => void;
  onMessageClick?: (messageId: string) => void;
}

export const MessageSearch: React.FC<MessageSearchProps> = ({ conversationId, onClose, onMessageClick }) => {
  const [q, setQ] = useState<string>("");
  const [type, setType] = useState<string>("all");
  const [results, setResults] = useState<Message[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Click outside to close
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    const fetchResults = async () => {
      if (!q.trim()) {
        setResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const typeParam = type === 'all' ? undefined : type;
        const res = await messageApi.searchMessages(conversationId, q, typeParam);
        const mapped = (res.data as any).data?.map(mapBackendMessage) || [];
        setResults(mapped.slice(0, 10)); // Chỉ lấy max 10 tin
      } catch (e) {
        console.error("Search error", e);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(() => {
      fetchResults();
    }, 300);

    return () => clearTimeout(debounce);
  }, [q, type, conversationId]);

  return (
    <div ref={searchRef} className="w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col animate-fade-in-down">
      <div className="p-3 border-b border-slate-100 flex flex-col gap-2 bg-slate-50">
        <div className="flex gap-2">
          <input
            autoFocus
            type="text"
            placeholder="Tìm kiếm tin nhắn..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="flex-1 px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          <select 
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-24 px-2 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">Tất cả</option>
            <option value="text">Text</option>
            <option value="image">Ảnh</option>
            <option value="video">Video</option>
            <option value="file">File</option>
          </select>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto custom-scrollbar p-2">
        {isSearching && (
          <div className="py-6 flex justify-center">
            <svg className="animate-spin w-6 h-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          </div>
        )}
        
        {!isSearching && q.trim() && results.length === 0 && (
          <div className="py-6 text-center text-sm text-slate-400">Không tìm thấy kết quả phù hợp</div>
        )}

        {!isSearching && results.map((m) => (
          <div 
            key={m._id} 
            className="p-3 mb-1 bg-white hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-xl transition-all cursor-pointer group"
            onClick={() => {
              if (onMessageClick) onMessageClick(m._id);
            }}
          >
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold text-blue-600 truncate">{m.sender?.fullName}</span>
              <span className="text-[10px] text-slate-400">
                {new Date(m.createdAt).toLocaleDateString()} {new Date(m.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </span>
            </div>
            
            {m.content && <p className="text-sm text-slate-700 line-clamp-2 leading-relaxed">{m.content}</p>}
            
            {m.fileName && (
              <a
                href={m.fileUrl || m.fileName}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors"
              >
                {m.messageType === 'image' ? '🖼️ Ảnh' : m.messageType === 'video' ? '🎥 Video' : '📄 File'}
                <span className="truncate max-w-[150px]">{m.fileName}</span>
              </a>
            )}
          </div>
        ))}

        {!q.trim() && (
          <div className="py-8 text-center text-sm text-slate-400 flex flex-col items-center gap-2">
            <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            Nhập từ khóa để tìm kiếm
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageSearch;