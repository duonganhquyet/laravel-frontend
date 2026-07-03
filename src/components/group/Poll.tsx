import React, { useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { pollApi, mapPoll } from '../../api/group.api';
import type { Poll as PollType } from '../../types/group.type';
import { useAuthStore } from '../../store/auth.store';

interface PollProps {
  conversationId: string;
}

export const Poll: React.FC<PollProps> = ({ conversationId }) => {
  const { user } = useAuthStore();
  const [polls, setPolls] = useState<PollType[]>([]);

  const fetchPolls = async () => {
    try {
      const res = await pollApi.getPolls(conversationId);
      const rawPolls = (res.data as any).data || res.data || [];
      setPolls(rawPolls.map(mapPoll));
    } catch (err: unknown) {
      console.error(err instanceof AxiosError ? err.response?.data : err);
    }
  };

  useEffect(() => {
    fetchPolls();
  }, [conversationId]);

  const handleVote = async (pollId: string, optionId: string) => {
    try {
      await pollApi.votePoll(pollId, optionId); 
      await fetchPolls();
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        alert(err.response?.data?.message || 'Lỗi khi bình chọn.');
      }
    }
  };

  return (
    <div className="space-y-4">
      {polls.map(poll => (
        <div key={poll.id} className="border p-3 rounded shadow-sm bg-blue-50 text-sm">
          <h4 className="font-bold">{poll.question}</h4>
          <div className="mt-2 space-y-2">
            {poll.options.map(opt => {
              const currentUserId = user?._id ?? (user?.id ? String(user.id) : '');
              const hasVoted = opt.voterIds.map(String).includes(currentUserId);
              return (
                <button 
                  key={opt.id}
                  onClick={() => handleVote(String(poll.id), String(opt.id))}
                  className={`block w-full text-left p-2 rounded border ${hasVoted ? 'bg-blue-200 border-blue-400' : 'bg-white hover:bg-gray-50'}`}
                >
                  {opt.optionText} - <span className="text-xs text-gray-500">{opt.voterIds.length} votes</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};