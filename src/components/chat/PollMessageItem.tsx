import React, { useEffect, useState } from 'react';
import { pollApi } from '../../api/group.api';
import type { Poll } from '../../types/group.type';
import { useAuthStore } from '../../store/auth.store';

interface PollMessageItemProps {
  pollId: string;
  conversationId: string;
}

export const PollMessageItem: React.FC<PollMessageItemProps> = ({ pollId, conversationId }) => {
  const { user } = useAuthStore();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPoll = async () => {
    try {
      setIsLoading(true);
      const res = await pollApi.getPolls(conversationId);
      const polls = (res.data as any).data || res.data || [];
      const foundPoll = polls.find((p: Poll) => p.PollId === pollId);
      if (foundPoll) {
        setPoll(foundPoll);
      }
    } catch (error) {
      console.error('Failed to fetch poll', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPoll();
  }, [pollId, conversationId]);

  const handleVote = async (optionId: string) => {
    try {
      await pollApi.votePoll(pollId, optionId);
      fetchPoll(); // Reload để lấy số vote mới
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể bình chọn');
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-[280px] bg-white border border-slate-200 rounded-2xl p-4 shadow-sm animate-pulse mx-auto my-2">
        <div className="h-4 bg-slate-200 rounded w-3/4 mb-4"></div>
        <div className="h-8 bg-slate-100 rounded-lg mb-2"></div>
        <div className="h-8 bg-slate-100 rounded-lg mb-2"></div>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="w-full flex justify-center my-4 animate-fade-in-up">
        <div className="bg-slate-50 border border-slate-200 text-slate-500 px-4 py-2 rounded-xl text-sm font-medium shadow-sm">
          Bình chọn không tồn tại hoặc đã bị xóa.
        </div>
      </div>
    );
  }

  // Calculate total votes
  const totalVotes = poll.Options.reduce((acc, opt) => acc + (opt.VoterIds?.length || 0), 0);

  return (
    <div className="w-full flex justify-center my-4 animate-fade-in-up">
      <div className="w-full max-w-[320px] bg-white border border-emerald-100 rounded-3xl shadow-lg shadow-emerald-500/10 overflow-hidden relative">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-3">
          <div className="flex items-center gap-2 text-white/90 mb-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            <span className="text-[11px] font-bold uppercase tracking-wider">Bình chọn nhóm</span>
          </div>
          <h4 className="font-bold text-white text-[15px] leading-snug">{poll.Question}</h4>
        </div>
        
        <div className="p-4 bg-white/50 backdrop-blur-md">
          <div className="space-y-2.5">
            {poll.Options.map(opt => {
              const votes = opt.VoterIds?.length || 0;
              const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
              const hasVoted = opt.VoterIds?.includes(user?._id || '');

              return (
                <div 
                  key={opt.OptionId}
                  onClick={() => handleVote(opt.OptionId)}
                  className="relative overflow-hidden rounded-xl border border-slate-200 cursor-pointer hover:border-emerald-300 transition-all group shadow-sm bg-white"
                >
                  {/* Progress bar background */}
                  <div 
                    className={`absolute inset-y-0 left-0 transition-all duration-700 ease-out ${hasVoted ? 'bg-emerald-100' : 'bg-slate-50 group-hover:bg-slate-100'}`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                  
                  <div className="relative z-10 flex justify-between items-center p-3">
                    <span className={`text-[13px] font-medium leading-tight max-w-[75%] ${hasVoted ? 'text-emerald-800' : 'text-slate-700'}`}>
                      {opt.OptionText}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {hasVoted && (
                        <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                      )}
                      <span className="text-[11px] font-bold text-slate-500 bg-white/80 px-1.5 py-0.5 rounded-md shadow-sm border border-slate-100">{percentage}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3.5 flex justify-between items-center">
            <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">{totalVotes} lượt bình chọn</span>
            <button onClick={fetchPoll} className="text-emerald-600 hover:text-emerald-700 p-1" title="Làm mới">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
