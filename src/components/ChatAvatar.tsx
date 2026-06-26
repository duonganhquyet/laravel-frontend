import { useState } from "react";
import { normalizeAvatarUrl, getInitials } from "../lib/utils";

interface Props {
  avatarUrl?: string | null;
  fullName: string;
  size?: number;
}

export const ChatAvatar = ({ avatarUrl, fullName, size = 40 }: Props) => {
  const [isError, setIsError] = useState(false);

  // 1. Lấy initials từ tên (ví dụ: "Nguyễn Văn Tùng" -> "NT")
  const initials = getInitials(fullName);

  /**
   * 2. Logic tạo màu nền cố định theo tên giống Telegram.
   * Cùng một cái tên sẽ luôn ra một màu nhất định.
   */
  const getTelegramColor = (name: string): string => {
    // Sử dụng gradient thay vì màu đơn – phù hợp dark theme
    const gradients = [
      "linear-gradient(135deg, #3b82f6, #6366f1)",   // Blue → Indigo
      "linear-gradient(135deg, #10b981, #06b6d4)",   // Emerald → Cyan
      "linear-gradient(135deg, #f59e0b, #ef4444)",   // Amber → Red
      "linear-gradient(135deg, #8b5cf6, #ec4899)",   // Violet → Pink
      "linear-gradient(135deg, #06b6d4, #3b82f6)",   // Cyan → Blue
      "linear-gradient(135deg, #f43f5e, #fb923c)",   // Rose → Orange
      "linear-gradient(135deg, #14b8a6, #22d3ee)",   // Teal → Cyan
      "linear-gradient(135deg, #a855f7, #6366f1)",   // Purple → Indigo
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
  };

  const bgGradient = getTelegramColor(fullName || "");
  const normalizedUrl = normalizeAvatarUrl(avatarUrl);

  const borderRadius = size >= 40 ? '13px' : '10px';
  const fontSize = size * 0.42;

  // 3. Nếu không có ảnh hoặc ảnh bị lỗi đường dẫn -> Hiện initials
  if (!normalizedUrl || isError) {
    return (
      <div
        style={{ 
          width: size, 
          height: size, 
          background: bgGradient,
          fontSize,
          borderRadius,
          boxShadow: `0 3px 10px rgba(0,0,0,0.3)`,
          flexShrink: 0,
        }}
        className="flex items-center justify-center text-white font-bold"
      >
        {initials}
      </div>
    );
  }

  // 4. Nếu có ảnh và ảnh load thành công
  return (
    <img
      src={normalizedUrl}
      alt={fullName}
      style={{
        width: size,
        height: size,
        borderRadius,
        objectFit: 'cover',
        flexShrink: 0,
        boxShadow: '0 3px 10px rgba(0,0,0,0.3)',
      }}
      onError={() => {
        // Khi link ảnh bị lỗi (404, chết link), state này sẽ kích hoạt render lại về dạng chữ
        setIsError(true);
      }}
    />
  );
};