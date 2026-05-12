import React, { useState } from "react";
import type { Message } from "../../types/message.type";
import { Input } from "../common/Input"; // Sử dụng lại component Input có sẵn

interface MessageSearchProps {
  messages: Message[];
}

export const MessageSearch: React.FC<MessageSearchProps> = ({ messages }) => {
  const [q, setQ] = useState<string>("");
  const [type, setType] = useState<string>("all");

  // Logic filter y hệt form bạn cung cấp, map với property viết hoa của dự án
  const filtered = messages.filter((m) => {
    // Tránh lỗi undefined nếu Content bị null
    const contentString = m.Content || ""; 
    const matchText = contentString.toLowerCase().includes(q.toLowerCase());
    const matchType = type === "all" || m.MessageType === type;

    return matchType && (matchText || m.FileName);
  });

  return (
    <div className="p-4 bg-white border rounded shadow-sm">
      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Tìm tin nhắn..."
          value={q}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQ(e.target.value)}
          className="mb-0 flex-1"
        />

        <select 
          value={type}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setType(e.target.value)}
          className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
        >
          <option value="all">Tất cả</option>
          <option value="text">Text</option>
          <option value="image">Ảnh</option>
          <option value="video">Video</option>
          <option value="file">File</option>
        </select>
      </div>

      <div className="max-h-60 overflow-y-auto space-y-2">
        {filtered.map((m) => (
          <div key={m.MessageId} className="p-3 bg-gray-50 border rounded text-sm break-words">
            <span className="text-gray-400 text-[10px] block mb-1">
              {new Date(m.CreatedAt).toLocaleString()}
            </span>
            
            {/* Hiển thị nội dung text */}
            {m.Content && <p className="text-gray-800">{m.Content}</p>}
            
            {/* Hiển thị link/tên file đính kèm nếu có */}
            {m.FileName && (
              <a
                href={m.FileName}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-xs mt-1 inline-flex items-center gap-1 block"
              >
                {m.MessageType === 'image' ? '🖼️ Xem ảnh' : 
                 m.MessageType === 'video' ? '🎥 Xem video' : '📄 Tải file'}
              </a>
            )}
          </div>
        ))}

        {/* Thông báo khi không có kết quả */}
        {filtered.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-4">Không tìm thấy kết quả phù hợp</p>
        )}
      </div>
    </div>
  );
};

export default MessageSearch;