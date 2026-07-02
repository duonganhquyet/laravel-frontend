import React, { useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { participantApi } from '../../api/conversation.api';
import type { ConversationParticipant } from '../../types/conversation.type';
import { useAuthStore } from '../../store/auth.store';

interface GroupMembersProps {
  conversationId: string;
}

export const GroupMembers: React.FC<GroupMembersProps> = ({ conversationId }) => {
  const { user } = useAuthStore();
  const [members, setMembers] = useState<ConversationParticipant[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await participantApi.getParticipants(conversationId);
        const data = (res.data as any).data || res.data || [];
        setMembers(data);
      } catch (err: unknown) {
        if (err instanceof AxiosError) {
          setError(err.response?.data?.message || 'Lỗi khi tải thành viên.');
        }
      }
    };
    fetchMembers();
  }, [conversationId]);

  const handleRemove = async (userId: string) => {
    if (!user) return;
    try {
      await participantApi.removeMember(conversationId, userId);
      setMembers(members.filter(m => m.userId !== userId));
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        alert(err.response?.data?.message || "Không có quyền hoặc lỗi hệ thống");
      }
    }
  };

  return (
    <div className="p-4 border rounded bg-white">
      <h3 className="font-bold mb-3">Thành viên ({members.length})</h3>
      {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
      <ul>
        {members.map(member => (
          <li key={member.userId} className="flex justify-between items-center mb-2 text-sm">
            <span>{member.fullName} - {member.role}</span>
            {member.role !== 'admin' && (
              <button 
                onClick={() => handleRemove(member.userId)}
                className="text-red-500 hover:underline"
              >
                Xóa
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};