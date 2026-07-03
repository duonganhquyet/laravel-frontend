import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { conversationApi } from '../../../api/conversation.api';
import { friendApi } from '../../../api/friend.api';
import type { User } from '../../../types/user.type';
import { AxiosError } from 'axios';

interface CreateGroupModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ onClose, onSuccess }) => {
  const [groupName, setGroupName] = useState('');
  const [friends, setFriends] = useState<User[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(true);
  const [searchFriend, setSearchFriend] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFriends = async () => {
      setIsLoadingFriends(true);
      try {
        const data = await friendApi.getFriends();
        setFriends(data);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoadingFriends(false);
      }
    };
    fetchFriends();
  }, []);

  const handleSelectUser = (user: User) => {
    if (!selectedUsers.find(u => u._id === user._id)) {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(u => u._id !== userId));
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      setError('Vui lòng nhập tên nhóm');
      return;
    }
    if (selectedUsers.length === 0) {
      setError('Vui lòng thêm ít nhất 1 thành viên');
      return;
    }

    setIsCreating(true);
    try {
      const userIds = selectedUsers.map(u => u._id);
      await conversationApi.createGroupChat(groupName, userIds);
      onSuccess();
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || 'Có lỗi xảy ra khi tạo nhóm');
      }
    } finally {
      setIsCreating(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl shadow-xl w-[90%] max-w-md overflow-hidden flex flex-col transform transition-all">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white">
          <h2 className="text-[16px] font-bold text-slate-800">Tạo nhóm chat mới</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-5">
          {error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">{error}</div>}
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tên nhóm</label>
            <input 
              type="text" 
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Nhập tên nhóm..."
              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all text-[14px]"
            />
          </div>

          <div className="relative flex-1 flex flex-col min-h-0">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Thêm thành viên (Từ danh sách bạn bè)</label>
            <input 
              type="text" 
              value={searchFriend}
              onChange={(e) => setSearchFriend(e.target.value)}
              placeholder="Tìm bạn bè..."
              className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all text-[14px] mb-3"
            />
            
            <div className="flex-1 overflow-y-auto max-h-48 custom-scrollbar bg-slate-50 border border-slate-100 rounded-xl p-2 space-y-1">
              {isLoadingFriends ? (
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
              ) : friends.length === 0 ? (
                <div className="text-center text-sm text-slate-400 p-4">Bạn chưa có người bạn nào.</div>
              ) : (
                friends.filter(f => f.fullName.toLowerCase().includes(searchFriend.toLowerCase())).map(friend => {
                  const isSelected = selectedUsers.some(u => u._id === friend._id);
                  return (
                    <div 
                      key={friend._id} 
                      onClick={() => isSelected ? handleRemoveUser(friend._id) : handleSelectUser(friend)}
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
                })
              )}
            </div>
          </div>

          {/* Selected Users */}
          {selectedUsers.length > 0 && (
            <div className="mt-2">
              <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Đã chọn ({selectedUsers.length})</label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar p-1">
                {selectedUsers.map(user => (
                  <div key={user._id} className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 pl-2 pr-1 py-1 rounded-full">
                    <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-bold">
                      {user.fullName.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-medium text-blue-700">{user.fullName.split(' ').pop()}</span>
                    <button 
                      onClick={() => handleRemoveUser(user._id)}
                      className="w-4 h-4 rounded-full flex items-center justify-center text-blue-400 hover:bg-blue-200 hover:text-blue-700 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-white flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-2 text-[14px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Hủy
          </button>
          <button 
            onClick={handleCreate}
            disabled={isCreating}
            className="px-5 py-2 text-[14px] font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isCreating ? 'Đang tạo...' : 'Tạo nhóm'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
