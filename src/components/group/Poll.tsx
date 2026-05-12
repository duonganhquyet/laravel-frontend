import React, { useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { pollApi } from '../../api/group.api';
import type { Poll as PollType } from '../../types/group.type';
import { useAuthStore } from '../../store/auth.store';

interface PollProps {
  conversationId: number;
}

export const Poll: React.FC<PollProps> = ({ conversationId }) => {
  const { user } = useAuthStore();
  const [polls, setPolls] = useState<PollType[]>([]);

  useEffect(() => {
    const fetchPolls = async () => {
      try {
        const res = await pollApi.getPolls(conversationId);
        setPolls(res.data);
      } catch (err: unknown) {
        console.error(err instanceof AxiosError ? err.response?.data : err);
      }
    };
    fetchPolls();
  }, [conversationId]);

  const handleVote = async (pollId: number, optionId: number) => {
    try {
      await pollApi.votePoll(pollId, optionId); 
      const res = await pollApi.getPolls(conversationId);
      setPolls(res.data);
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        alert(err.response?.data?.message || 'Lỗi khi bình chọn.');
      }
    }
  };

  return (
    <div className="space-y-4">
      {polls.map(poll => (
        <div key={poll.PollId} className="border p-3 rounded shadow-sm bg-blue-50 text-sm">
          <h4 className="font-bold">{poll.Question}</h4>
          <div className="mt-2 space-y-2">
            {poll.Options.map(opt => {
              const hasVoted = opt.VoterIds.includes(user?.UserId || 0);
              return (
                <button 
                  key={opt.OptionId}
                  onClick={() => handleVote(poll.PollId, opt.OptionId)}
                  className={`block w-full text-left p-2 rounded border ${hasVoted ? 'bg-blue-200 border-blue-400' : 'bg-white hover:bg-gray-50'}`}
                >
                  {opt.OptionText} - <span className="text-xs text-gray-500">{opt.VoterIds.length} votes</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};