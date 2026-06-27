import React, { useEffect, useState } from 'react';
import type { User } from '../../types/user.type';
import { friendApi, type FriendStatus } from '../../api/friend.api';
import { conversationApi } from '../../api/conversation.api';
import { useAuthStore } from '../../store/auth.store';

interface UserProfileViewProps {
  user: User;
  onStartChat: (conversationId: string) => void;
  onClose: () => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({ user, onStartChat, onClose }) => {
  const { user: currentUser } = useAuthStore();
  const [friendStatus, setFriendStatus] = useState<FriendStatus>('none');
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const status = await friendApi.checkFriendStatus(user._id);
      setFriendStatus(status);
    } catch (e) {
      console.error(e);
      setFriendStatus('none');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [user._id]);

  const handleAction = async (action: 'add' | 'cancel' | 'unfriend' | 'accept') => {
    setIsActionLoading(true);
    try {
      if (action === 'add') {
        await friendApi.sendFriendRequest(user._id);
      } else if (action === 'cancel') {
        await friendApi.cancelRequest(user._id);
      } else if (action === 'unfriend') {
        if (window.confirm(`Bạn có chắc muốn hủy kết bạn với ${user.fullName}?`)) {
          await friendApi.unfriend(user._id);
        }
      } else if (action === 'accept') {
        // Trong thực tế cần có requestId, ở mock này ta sẽ mock việc chấp nhận bằng ID user luôn (hoặc bỏ qua)
        // Vì mock API expect requestId, mà ở đây ta chỉ có user._id. Ta sẽ cần gọi endpoint riêng hoặc thay đổi logic mock.
        // Để đơn giản, giả lập lấy được reqId từ getFriendRequests.
        const reqs = await friendApi.getFriendRequests();
        const req = reqs.find(r => r.sender._id === user._id);
        if (req) await friendApi.acceptRequest(req.id);
      }
      await fetchStatus();
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleStartChat = async () => {
    setIsActionLoading(true);
    try {
      // Gọi backend để tạo hoặc lấy conversationId 1-1 với người dùng này
      const res = await conversationApi.createDirectChat(user._id);
      const resData = res.data as any;
      const conversationId = resData?.data?._id || resData?._id;
      if (conversationId) {
        onStartChat(conversationId);
      } else {
        alert("Không thể lấy ID cuộc trò chuyện.");
      }
    } catch (e: unknown) {
      console.error(e);
      if (e instanceof Error) {
        // @ts-ignore
        alert(e.response?.data?.message || 'Có lỗi xảy ra khi tạo cuộc trò chuyện');
      } else {
        alert('Có lỗi xảy ra khi tạo cuộc trò chuyện');
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 relative animate-fade-in-up">
      {/* Nút Đóng (Tùy chọn) */}
      <button 
        onClick={onClose}
        className="absolute top-6 left-6 p-2 bg-white text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors shadow-sm"
        title="Đóng hồ sơ"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
      </button>

      <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 w-[400px] flex flex-col items-center text-center">
        {/* Avatar lớn */}
        <div className="relative mb-6">
          <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-5xl shadow-lg border-4 border-white">
            {user.fullName.charAt(0).toUpperCase()}
          </div>
          {user.isOnline && (
            <div className="absolute bottom-2 right-2 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full shadow-sm"></div>
          )}
        </div>

        {/* Thông tin */}
        <h2 className="text-2xl font-bold text-slate-800 mb-1">{user.fullName}</h2>
        <p className="text-slate-500 mb-6 font-medium">{user.email}</p>

        {/* Actions */}
        {isLoading ? (
          <div className="flex gap-2">
            <div className="w-32 h-10 bg-slate-200 animate-pulse rounded-xl"></div>
            <div className="w-32 h-10 bg-slate-200 animate-pulse rounded-xl"></div>
          </div>
        ) : (
          <div className="flex gap-3 w-full justify-center">
            <button 
              onClick={handleStartChat}
              disabled={isActionLoading}
              className="flex-1 py-2.5 px-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              Nhắn tin
            </button>

            {user._id !== currentUser?._id && friendStatus === 'none' && (
              <button 
                onClick={() => handleAction('add')}
                disabled={isActionLoading}
                className="flex-1 py-2.5 px-4 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                Kết bạn
              </button>
            )}

            {user._id !== currentUser?._id && friendStatus === 'pending_sent' && (
              <button 
                onClick={() => handleAction('cancel')}
                disabled={isActionLoading}
                className="flex-1 py-2.5 px-4 bg-amber-50 text-amber-600 border border-amber-200 font-semibold rounded-xl hover:bg-amber-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                Đã gửi lời mời
              </button>
            )}

            {user._id !== currentUser?._id && friendStatus === 'pending_received' && (
              <button 
                onClick={() => handleAction('accept')}
                disabled={isActionLoading}
                className="flex-1 py-2.5 px-4 bg-emerald-50 text-emerald-600 border border-emerald-200 font-semibold rounded-xl hover:bg-emerald-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                Chấp nhận
              </button>
            )}

            {user._id !== currentUser?._id && friendStatus === 'friends' && (
              <button 
                onClick={() => handleAction('unfriend')}
                disabled={isActionLoading}
                className="flex-1 py-2.5 px-4 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-red-50 hover:text-red-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" /></svg>
                Bạn bè
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
