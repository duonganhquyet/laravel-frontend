import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AxiosError } from 'axios';
import { participantApi, conversationApi } from '../../../api/conversation.api';
import type { ConversationParticipant, Conversation } from '../../../types/conversation.type';
import { useAuthStore } from '../../../store/auth.store';
import { useToastStore } from '../../../store/toast.store';
import { useConfirmStore } from '../../../store/confirm.store';

interface GroupMembersModalProps {
  conversation: Conversation;
  onClose: () => void;
  onRefresh?: () => void;
  onLeaveGroup?: () => void;
}

type RoleRank = 1 | 2 | 3; // 1=member, 2=admin(manager), 3=creator

function getRoleRank(role: ConversationParticipant['role']): RoleRank {
  if (role === 'creator') return 3;
  if (role === 'admin') return 2;
  return 1;
}

function getRoleLabel(role: ConversationParticipant['role']) {
  if (role === 'creator') return 'ADMIN';
  if (role === 'admin') return 'Quản trị viên';
  return 'Thành viên';
}

function getRoleColor(role: ConversationParticipant['role']) {
  if (role === 'creator') return 'text-amber-600 bg-amber-50 border border-amber-200';
  if (role === 'admin') return 'text-indigo-600 bg-indigo-50 border border-indigo-200';
  return 'text-slate-500 bg-slate-100 border border-slate-200';
}

export const GroupMembersModal: React.FC<GroupMembersModalProps> = ({ conversation, onClose, onRefresh, onLeaveGroup }) => {
  const { user } = useAuthStore();
  const [participants, setParticipants] = useState<ConversationParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // Determine current user's role rank
  const myParticipant = participants.find(p => p.userId === user?._id || p.userId === String(user?.id));
  const myRank: RoleRank = myParticipant ? getRoleRank(myParticipant.role) : 1;
  const isCreator = myRank === 3;

  const fetchParticipants = async () => {
    try {
      const res = await participantApi.getParticipants(conversation._id);
      const data = (res.data as any).data || res.data || [];
      // Sort: creator first, then admins, then members
      const sorted = [...data].sort((a: ConversationParticipant, b: ConversationParticipant) => {
        return getRoleRank(b.role) - getRoleRank(a.role);
      });
      setParticipants(sorted);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchParticipants();
  }, [conversation._id]);

  const handleToggleAdmin = async (targetParticipant: ConversationParticipant) => {
    setActiveMenu(null);
    try {
      await participantApi.grantAdmin(conversation._id, targetParticipant.userId);
      await fetchParticipants();
      onRefresh?.();
      const action = targetParticipant.role === 'member' ? 'cấp quyền quản trị cho' : 'gỡ quyền quản trị của';
      useToastStore.getState().success(`Đã ${action} ${targetParticipant.fullName}`);
    } catch (error) {
      const msg = error instanceof AxiosError ? error.response?.data?.message : 'Không thể thay đổi quyền';
      useToastStore.getState().error(msg || 'Không thể thay đổi quyền');
    }
  };

  const handleRemoveMember = async (targetParticipant: ConversationParticipant) => {
    const confirmed = await useConfirmStore.getState().show({
      title: 'Xóa thành viên',
      message: `Bạn có chắc chắn muốn xóa ${targetParticipant.fullName} khỏi nhóm?`,
      confirmText: 'Xóa',
    });
    if (!confirmed) return;
    setActiveMenu(null);
    try {
      await participantApi.removeMember(conversation._id, targetParticipant.userId);
      setParticipants(prev => prev.filter(p => p.userId !== targetParticipant.userId));
      onRefresh?.();
      useToastStore.getState().success(`Đã xóa ${targetParticipant.fullName} khỏi nhóm`);
    } catch (error) {
      const msg = error instanceof AxiosError ? error.response?.data?.message : 'Không thể xóa thành viên';
      useToastStore.getState().error(msg || 'Không thể xóa thành viên này');
    }
  };

  const handleLeaveGroup = async () => {
    const isCreator = conversation.creatorId === user?._id || conversation.creatorId === String(user?.id);
    const confirmed = await useConfirmStore.getState().show({
      title: isCreator ? 'Giải tán nhóm' : 'Rời khỏi nhóm',
      message: isCreator 
        ? 'Bạn là chủ nhóm. Nếu bạn rời đi, nhóm chat này sẽ bị giải tán hoàn toàn. Bạn có chắc chắn muốn rời và giải tán nhóm?'
        : 'Bạn có chắc chắn muốn rời khỏi nhóm này?',
      confirmText: isCreator ? 'Giải tán & Rời đi' : 'Rời nhóm',
    });
    if (!confirmed) return;
    try {
      await conversationApi.leaveGroup(conversation._id);
      onClose();
      onLeaveGroup?.();
    } catch (error) {
      const msg = error instanceof AxiosError ? error.response?.data?.message : 'Không thể rời nhóm';
      useToastStore.getState().error(msg || 'Không thể rời nhóm');
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) { setActiveMenu(null); onClose(); } }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-[90%] max-w-md overflow-hidden flex flex-col transform animate-fade-in-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            Thành viên nhóm
            <span className="ml-1 text-sm font-normal text-slate-400">({participants.length})</span>
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Role legend */}
        <div className="px-5 py-2 border-b border-slate-100 bg-slate-50 flex items-center gap-3 text-[11px] font-semibold text-slate-500 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            ADMIN (Trưởng nhóm)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-indigo-400"></span>
            Quản trị viên
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-slate-300"></span>
            Thành viên
          </span>
        </div>

        {/* Body */}
        <div className="p-4 flex-1 overflow-y-auto max-h-96 bg-white">
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-2">
              {participants.map(p => {
                const targetRank = getRoleRank(p.role);
                const canManage = myRank > targetRank && p.userId !== user?._id;
                const canGrantAdmin = isCreator && p.userId !== user?._id && p.role !== 'creator';
                const canKick = canManage;
                const isMe = p.userId === user?._id || p.userId === String(user?.id);

                return (
                  <div
                    key={p.userId}
                    className={`p-3 border rounded-xl flex items-center justify-between gap-3 shadow-sm hover:shadow-md transition-all relative ${
                      p.role === 'creator'
                        ? 'bg-amber-50 border-amber-200'
                        : p.role === 'admin'
                          ? 'bg-indigo-50/50 border-indigo-100'
                          : 'bg-slate-50 border-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        {p.avatar ? (
                          <img src={p.avatar} alt="Avatar" className="w-10 h-10 rounded-full object-cover shadow-sm" />
                        ) : (
                          <div className={`w-10 h-10 rounded-full text-white flex items-center justify-center font-bold text-sm shadow-sm ${
                            p.role === 'creator'
                              ? 'bg-gradient-to-tr from-amber-400 to-orange-500'
                              : p.role === 'admin'
                                ? 'bg-gradient-to-tr from-indigo-400 to-blue-500'
                                : 'bg-gradient-to-tr from-slate-300 to-slate-400'
                          }`}>
                            {p.fullName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {/* Crown icon for creator */}
                        {p.role === 'creator' && (
                          <div className="absolute -top-1.5 -right-1.5 bg-amber-400 rounded-full w-4 h-4 flex items-center justify-center shadow-sm">
                            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-slate-800 truncate flex items-center gap-1.5">
                          {p.fullName}
                          {isMe && <span className="text-xs font-normal text-slate-400">(Bạn)</span>}
                        </span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md w-fit mt-0.5 ${getRoleColor(p.role)}`}>
                          {getRoleLabel(p.role)}
                        </span>
                      </div>
                    </div>

                    {/* Action menu */}
                    {(canKick || canGrantAdmin) && (
                      <div className="shrink-0">
                        <button
                          onClick={() => setActiveMenu(activeMenu === p.userId ? null : p.userId)}
                          className="p-1.5 text-slate-400 hover:bg-white hover:text-slate-700 rounded-lg transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                        </button>

                        {activeMenu === p.userId && (
                          <div className="absolute right-12 top-2 w-52 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-20 animate-fade-in-up">
                            {/* Grant/revoke admin — only creator can do this */}
                            {canGrantAdmin && (
                              <button
                                onClick={() => handleToggleAdmin(p)}
                                className="w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-slate-50 flex items-center gap-2"
                              >
                                {p.role === 'admin' ? (
                                  <>
                                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" /></svg>
                                    <span className="text-slate-600">Gỡ quyền quản trị</span>
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                    <span className="text-indigo-600">Cấp quyền quản trị</span>
                                  </>
                                )}
                              </button>
                            )}

                            {/* Kick — creator can kick admin/member; admin can only kick member */}
                            {canKick && (
                              <>
                                {canGrantAdmin && <div className="border-t border-slate-100" />}
                                <button
                                  onClick={() => handleRemoveMember(p)}
                                  className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" /></svg>
                                  Xóa khỏi nhóm
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50">
          <button
            onClick={handleLeaveGroup}
            className="w-full py-2.5 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors border border-red-100 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Rời nhóm
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
