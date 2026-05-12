import { useRef, useEffect } from "react";
import { useChat } from "../hooks/useChat";
import { ChatAvatar } from "./ChatAvatar";
import { isSameSender, isSameDay, formatDaySeparator } from "../lib/utils";

export const MessageList = ({ conversationId }: { conversationId: string }) => {
  const { messages, loadMore, hasMore, loadingMore, user, page } = useChat(conversationId);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastScrollHeight = useRef<number>(0);

  // 1. Xử lý khi người dùng cuộn lên đỉnh để load thêm tin cũ
  const handleScroll = () => {
    if (scrollRef.current && scrollRef.current.scrollTop === 0 && hasMore && !loadingMore) {
      lastScrollHeight.current = scrollRef.current.scrollHeight;
      loadMore();
    }
  };

  // 2. Giữ vị trí cuộn khi load thêm tin nhắn cũ (Infinite Scroll)
  useEffect(() => {
    if (scrollRef.current && lastScrollHeight.current > 0) {
      const scrollDiff = scrollRef.current.scrollHeight - lastScrollHeight.current;
      scrollRef.current.scrollTop = scrollDiff;
      lastScrollHeight.current = 0;
    }
  }, [messages]);

  // 3. Cuộn xuống cuối khi có tin nhắn mới (Real-time)
  useEffect(() => {
    if (scrollRef.current && page === 1 && !loadingMore) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, page, loadingMore]);

  return (
    <div 
      ref={scrollRef} 
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0e1621] custom-scrollbar flex flex-col"
    >
      {/* Loading indicator cho phân trang ngược */}
      {loadingMore && (
        <div className="flex justify-center p-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {!hasMore && messages.length > 0 && (
        <div className="flex items-center justify-center gap-2 py-4">
          <div className="flex-1 h-px bg-gray-600"></div>
          <p className="text-center text-gray-400 text-xs whitespace-nowrap px-2">
            Đây là bắt đầu của cuộc trò chuyện
          </p>
          <div className="flex-1 h-px bg-gray-600"></div>
        </div>
      )}

      {messages.map((msg, index) => {
        // Xử lý an toàn cho SenderId
        const senderId = msg.SenderId;
        
        if (!user || !senderId) return null;
        
        const isMine = senderId === user.UserId;
        
        // Kiểm tra xem có cần hiển thị day separator
        const prevMsg = index > 0 ? messages[index - 1] : null;
        const showDaySeparator = !prevMsg || !isSameDay(prevMsg.CreatedAt, msg.CreatedAt);
        
        // Kiểm tra xem có cần hiển thị avatar/sender name
        const isFirstFromSender = !prevMsg || !isSameSender(msg, prevMsg);
        const showAvatar = !isMine && isFirstFromSender;
        
        return (
          <div key={msg.MessageId}>
            {/* Day separator */}
            {showDaySeparator && (
              <div className="flex items-center justify-center gap-2 py-3">
                <div className="flex-1 h-px bg-gray-600"></div>
                <p className="text-center text-gray-400 text-xs whitespace-nowrap">
                  {formatDaySeparator(msg.CreatedAt)}
                </p>
                <div className="flex-1 h-px bg-gray-600"></div>
              </div>
            )}

            <div 
              className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* Avatar hoặc spacing */}
              {isMine ? (
                // Không hiển thị avatar cho tin của mình
                <div className="w-8 shrink-0" />
              ) : showAvatar ? (
                // Hiển thị avatar khi là tin đầu từ người này
                <ChatAvatar 
                  avatarUrl={null} 
                  fullName={"User"} 
                  size={32} 
                />
              ) : (
                // Không hiển thị avatar cho tin tiếp theo từ cùng người
                <div className="w-8 shrink-0" />
              )}
              
              <div className="flex flex-col gap-1">
                {/* Sender name (chỉ hiển thị khi không có avatar hoặc là tin từ người khác) */}
                {!isMine && isFirstFromSender && (
                  <p className="text-xs text-gray-300 px-1">
                    {"User"}
                  </p>
                )}
                
                {/* Message bubble */}
                <div className={`max-w-[70%] p-3 rounded-2xl text-white shadow-sm ${
                  isMine 
                    ? "bg-[#2b5278] rounded-br-none" 
                    : "bg-[#182533] rounded-bl-none"
                }`}>
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {msg.Content}
                  </p>
                  <span className="block text-xs text-gray-400 text-right mt-1">
                    {new Date(msg.CreatedAt).toLocaleTimeString("vi-VN", { 
                      hour: "2-digit", 
                      minute: "2-digit" 
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};