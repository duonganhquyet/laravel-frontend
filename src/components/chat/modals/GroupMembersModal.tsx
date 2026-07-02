import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { participantApi, conversationApi } from '../../../api/conversation.api';
import type { ConversationParticipant, Conversation } from '../../../types/conversation.type';
import { useAuthStore } from '../../../store/auth.store';

interface GroupMembersModalProps {
  conversation: Conversation;
  onClose: () => void;
}

export const GroupMembersModal: React.FC<GroupMembersModalProps> = ({ conversation, onClose }) => {
  const { user } = useAuthStore();
  const [participants, setParticipants] = useState<ConversationParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  
  const isAdmin = conversation.groupAdmins.includes(user?._id || '');

  const fetchParticipants = async () => {
    try {
      const res = await participantApi.getParticipants(conversation._id);
      const data = (res.data as any).data || res.data || [];
      setParticipants(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchParticipants();
  }, [conversation._id]);

  const handleGrantAdmin = async (targetUserId: string) => {
    setActiveMenu(null);
    try {
      await participantApi.grantAdmin(conversation._id, targetUserId);
      fetchParticipants();
    } catch (error) {
      console.error(error);
      alert('Không thể cấp quyền quản trị');
    }
  };

  const handleRemoveMember = async (targetUserId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa thành viên này khỏi nhóm?')) return;
    setActiveMenu(null);
    try {
      await participantApi.removeMember(conversation._id, targetUserId);
      setParticipants(prev => prev.filter(p => p.userId !== targetUserId));
    } catch (error) {
      console.error(error);
      alert('Không thể xóa thành viên này');
    }
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn rời khỏi nhóm này?')) return;
    try {
      await conversationApi.leaveGroup(conversation._id);
      onClose();
      // Chuyển hướng hoặc reload sẽ do ChatWindow lo (nếu cần)
    } catch (error) {
      console.error(error);
      alert('Không thể rời nhóm');
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl shadow-xl w-[90%] max-w-md overflow-hidden flex flex-col transform transition-all animate-fade-in-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            Thành viên nhóm ({participants.length})
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 flex-1 overflow-y-auto max-h-96 custom-scrollbar bg-white">
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-3 relative">
              {participants.map(p => (
                <div key={p.userId} className="p-3 border border-slate-100 rounded-xl bg-slate-50 flex items-center justify-between gap-3 shadow-sm hover:shadow-md transition-shadow relative">
                  <div className="flex items-center gap-3 min-w-0">
                    {p.avatar ? (
                      <img src={p.avatar} alt="Avatar" className="w-10 h-10 rounded-full object-cover shadow-sm shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-400 to-indigo-500 text-white flex shrink-0 items-center justify-center font-bold text-sm shadow-sm">
                        {p.fullName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold text-slate-800 truncate flex items-center gap-2">
                        {p.fullName} {p.userId === user?._id && <span className="text-xs font-normal text-slate-500">(Bạn)</span>}
                      </span>
                      <span className={`text-[11px] font-semibold uppercase tracking-wider ${p.role === 'admin' ? 'text-indigo-600' : 'text-slate-500'}`}>
                        {p.role === 'admin' ? 'Quản trị viên' : 'Thành viên'}
                      </span>
                    </div>
                  </div>

                  {isAdmin && p.userId !== user?._id && (
                    <div>
                      <button 
                        onClick={() => setActiveMenu(activeMenu === p.userId ? null : p.userId)}
                        className="p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 rounded-lg transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                      </button>
                      
                      {activeMenu === p.userId && (
                        <div className="absolute right-12 top-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-10 animate-fade-in-up">
                          <button 
                            onClick={() => handleGrantAdmin(p.userId)}
                            disabled={p.role === 'admin'}
                            className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                            Cấp quyền quản trị
                          </button>
                          <div className="border-t border-slate-100"></div>
                          <button 
                            onClick={() => handleRemoveMember(p.userId)}
                            className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            Xóa thành viên
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-center">
          <button 
            onClick={handleLeaveGroup}
            className="w-full py-2.5 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors border border-red-100 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Rời nhóm
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
