/**
 * Chuẩn hóa avatar URL
 * @param url - URL avatar từ backend
 * @returns URL đầy đủ hoặc null
 */
export const normalizeAvatarUrl = (url?: string | null): string | null => {
  if (!url || url.trim() === "") return null;
  
  // Nếu đã là full URL
  if (url.startsWith("http")) return url;
  
  // Nếu là relative path
  const baseUrl = "http://localhost:8000";
  const normalizedUrl = url.startsWith("/") ? url : `/${url}`;
  return `${baseUrl}${normalizedUrl}`;
};

/**
 * Lấy initials từ tên (ví dụ: "Nguyễn Văn Tùng" → "NT")
 * @param fullName - Tên đầy đủ
 * @returns 1-2 ký tự viết hoa
 */
export const getInitials = (fullName?: string | null): string => {
  if (!fullName) return "?";
  
  const parts = fullName.trim().split(/\s+/);
  
  if (parts.length === 1) {
    // Chỉ có 1 từ: lấy ký tự đầu
    return parts[0].charAt(0).toUpperCase();
  }
  
  // Có 2+ từ: lấy ký tự đầu + cuối
  const first = parts[0].charAt(0);
  const last = parts[parts.length - 1].charAt(0);
  return (first + last).toUpperCase();
};

/**
 * Kiểm tra 2 tin nhắn có từ cùng người gửi không
 * @param msg1 - Tin nhắn 1
 * @param msg2 - Tin nhắn 2
 * @returns true nếu cùng người gửi
 */
export const isSameSender = (msg1: any, msg2: any): boolean => {
  const senderId1 = msg1.SenderId;
  const senderId2 = msg2.SenderId;
  return senderId1 && senderId2 && senderId1 === senderId2;
};

/**
 * Kiểm tra 2 tin nhắn có cùng ngày gửi không
 * @param date1 - Ngày tin 1
 * @param date2 - Ngày tin 2
 * @returns true nếu cùng ngày
 */
export const isSameDay = (date1: string, date2: string): boolean => {
  const d1 = new Date(date1).toDateString();
  const d2 = new Date(date2).toDateString();
  return d1 === d2;
};

/**
 * Format ngày cho day separator
 * @param date - ISO date string
 * @returns Chuỗi ngày định dạng (ví dụ: "Hôm nay", "Hôm qua", "1/5/2026")
 */
export const formatDaySeparator = (date: string): string => {
  const msgDate = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const msgDateStr = msgDate.toDateString();
  const todayStr = today.toDateString();
  const yesterdayStr = yesterday.toDateString();
  
  if (msgDateStr === todayStr) return "Hôm nay";
  if (msgDateStr === yesterdayStr) return "Hôm qua";
  
  // Format: "d/m/yyyy"
  return msgDate.toLocaleDateString("vi-VN");
};
