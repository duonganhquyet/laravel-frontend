import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { User } from '../../../types/user.type';
import { participantApi } from '../../../api/conversation.api';
import { friendApi } from '../../../api/friend.api';
import { AxiosError } from 'axios';

interface AddMemberModalProps {
  conversationId: string;
  onClose: () => void;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({ conversationId, onClose }) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [friends, setFriends] = useState<User[]>([]);
  const [searchFriend, setSearchFriend] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [existingUserIds, setExistingUserIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [friendsData, participantsData] = await Promise.all([
          friendApi.getFriends(),
          participantApi.getParticipants(conversationId)
        ]);

        const participantsList = (participantsData.data as any).data || participantsData.data || [];
        const userIds = new Set<string>(participantsList.map((p: any) => p.userId));
        setExistingUserIds(userIds);
        setFriends(friendsData);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    if (conversationId) {
      loadData();
    }
  }, [conversationId]);

  const handleAdd = async () => {
    if (!selectedUser) {
      setError('Vui lòng chọn một người dùng');
      return;
    }

    setIsAdding(true);
    setError('');
    setSuccess('');
    
    try {
      await participantApi.addMember(conversationId, selectedUser._id);
      setSuccess(`Đã thêm ${selectedUser.fullName} vào nhóm thành công!`);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || 'Không thể thêm thành viên này');
      }
    } finally {
      setIsAdding(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl shadow-xl w-[90%] max-w-md overflow-hidden flex flex-col transform transition-all">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
            Thêm thành viên
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-4">
          {error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">{error}</div>}
          {success && <div className="p-3 text-sm text-emerald-600 bg-emerald-50 rounded-lg border border-emerald-100">{success}</div>}
          
          <div className="relative flex-1 flex flex-col min-h-0">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Thêm thành viên (Từ danh sách bạn bè)</label>
            <input 
              type="text" 
              value={searchFriend}
              onChange={(e) => setSearchFriend(e.target.value)}
              placeholder="Tìm bạn bè..."
              className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all text-[14px] mb-3"
            />
            
            <div className="flex-1 overflow-y-auto max-h-56 custom-scrollbar bg-slate-50 border border-slate-100 rounded-xl p-2 space-y-1">
              {isLoading ? (
                <div className="space-y-2 p-1">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg animate-pulse bg-white border border-transparent">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200" />
                        <div className="h-3 bg-slate-200 rounded w-24" />
                      </div>
                      <div className="w-5 h-5 rounded-full bg-slate-200" />
                    </div>
                  ))}
                </div>
              ) : (() => {
                const availableFriends = friends.filter(f => !existingUserIds.has(f._id));
                const searchedFriends = availableFriends.filter(f => 
                  f.fullName.toLowerCase().includes(searchFriend.toLowerCase())
                );

                if (availableFriends.length === 0) {
                  return <div className="text-center text-sm text-slate-400 p-4">Tất cả bạn bè đã tham gia nhóm.</div>;
                }
                
                if (searchedFriends.length === 0) {
                  return <div className="text-center text-sm text-slate-400 p-4">Không tìm thấy bạn bè phù hợp.</div>;
                }

                return searchedFriends.map(friend => {
                  const isSelected = selectedUser?._id === friend._id;
                  return (
                    <div 
                      key={friend._id} 
                      onClick={() => isSelected ? setSelectedUser(null) : setSelectedUser(friend)}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors border ${
                        isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white border-transparent hover:bg-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                          {friend.fullName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-[14px] font-medium text-slate-800">{friend.fullName}</span>
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        isSelected ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-300'
                      }`}>
                        {isSelected && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Hủy
          </button>
          <button 
            onClick={handleAdd}
            disabled={!selectedUser || isAdding}
            className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isAdding ? 'Đang thêm...' : 'Thêm vào nhóm'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
