import React, { useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { pollApi } from '../../../api/group.api';
import type { Poll } from '../../../types/group.type';
import { useAuthStore } from '../../../store/auth.store';

interface PollsModalProps {
  conversationId: string;
  onClose: () => void;
}

export const PollsModal: React.FC<PollsModalProps> = ({ conversationId, onClose }) => {
  const { user } = useAuthStore();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State cho việc tạo poll mới
  const [isCreating, setIsCreating] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newOptions, setNewOptions] = useState<string[]>(['', '']); // Bắt đầu với 2 option rỗng
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPolls = async () => {
    setIsLoading(true);
    try {
      const res = await pollApi.getPolls(conversationId);
      setPolls((res.data as any).data || res.data || []);
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || 'Không thể tải bình chọn');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPolls();
  }, [conversationId]);

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    const validOptions = newOptions.filter(o => o.trim() !== '');
    if (!newQuestion.trim() || validOptions.length < 2) {
      setError('Vui lòng nhập câu hỏi và ít nhất 2 lựa chọn');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await pollApi.createPoll(conversationId, newQuestion, validOptions);
      setNewQuestion('');
      setNewOptions(['', '']);
      setIsCreating(false);
      fetchPolls();
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || 'Không thể tạo bình chọn');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = async (pollId: string, optionId: string) => {
    try {
      await pollApi.votePoll(pollId, optionId);
      fetchPolls(); // Reload để lấy số vote mới
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        alert(err.response?.data?.message || 'Không thể bình chọn');
      }
    }
  };

  const handleAddOptionField = () => {
    setNewOptions([...newOptions, '']);
  };

  const handleUpdateOption = (index: number, value: string) => {
    const updated = [...newOptions];
    updated[index] = value;
    setNewOptions(updated);
  };

  const handleRemoveOptionField = (index: number) => {
    if (newOptions.length > 2) {
      const updated = newOptions.filter((_, i) => i !== index);
      setNewOptions(updated);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/50 backdrop-blur-sm transition-opacity">
      <div className="bg-white shadow-2xl w-full max-w-md h-full flex flex-col transform transition-transform animate-slide-in-right">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-emerald-50">
          <h2 className="text-lg font-bold text-emerald-800 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            Bình chọn nhóm
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-emerald-100 rounded-full transition-colors text-emerald-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50 relative">
          {error && <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">{error}</div>}
          
          {isLoading ? (
            <div className="flex justify-center items-center h-32 text-slate-400">
              <svg className="animate-spin h-6 w-6 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            </div>
          ) : isCreating ? (
            <form onSubmit={handleCreatePoll} className="bg-white p-5 rounded-xl shadow-sm border border-emerald-100 animate-fade-in-up">
              <h3 className="font-bold text-slate-800 mb-4">Tạo bình chọn mới</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Câu hỏi</label>
                <input 
                  type="text" 
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="VD: Trưa nay ăn gì?"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Các lựa chọn</label>
                {newOptions.map((opt, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <input 
                      type="text" 
                      value={opt}
                      onChange={(e) => handleUpdateOption(idx, e.target.value)}
                      placeholder={`Lựa chọn ${idx + 1}`}
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                    {newOptions.length > 2 && (
                      <button type="button" onClick={() => handleRemoveOptionField(idx)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    )}
                  </div>
                ))}
                <button 
                  type="button" 
                  onClick={handleAddOptionField}
                  className="text-sm text-emerald-600 font-medium hover:text-emerald-700 flex items-center gap-1 mt-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Thêm lựa chọn
                </button>
              </div>

              <div className="flex gap-2 mt-6">
                <button type="button" onClick={() => setIsCreating(false)} className="flex-1 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                  Hủy
                </button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-2 text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg shadow-md disabled:opacity-50 transition-colors">
                  {isSubmitting ? 'Đang tạo...' : 'Tạo bình chọn'}
                </button>
              </div>
            </form>
          ) : polls.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              </div>
              <p className="text-slate-500 font-medium">Chưa có bình chọn nào</p>
            </div>
          ) : (
            <div className="space-y-4">
              {polls.map(poll => {
                // Tính tổng số lượt vote để render thanh progress bar
                const totalVotes = poll.Options.reduce((acc, opt) => acc + (opt.VoterIds?.length || 0), 0);

                return (
                  <div key={poll.PollId} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                    <h4 className="font-bold text-slate-800 mb-3">{poll.Question}</h4>
                    <div className="space-y-2">
                      {poll.Options.map(opt => {
                        const votes = opt.VoterIds?.length || 0;
                        const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                        const hasVoted = opt.VoterIds?.includes(user?._id || ''); // Giả định user._id map với VoterIds

                        return (
                          <div 
                            key={opt.OptionId}
                            onClick={() => handleVote(poll.PollId, opt.OptionId)}
                            className="relative overflow-hidden rounded-lg border border-slate-200 cursor-pointer hover:border-emerald-300 transition-colors group"
                          >
                            {/* Progress bar background */}
                            <div 
                              className={`absolute inset-y-0 left-0 transition-all duration-500 ${hasVoted ? 'bg-emerald-100' : 'bg-slate-100 group-hover:bg-slate-200'}`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                            
                            <div className="relative z-10 flex justify-between items-center p-3">
                              <span className={`text-sm font-medium ${hasVoted ? 'text-emerald-700' : 'text-slate-700'}`}>
                                {opt.OptionText}
                              </span>
                              <div className="flex items-center gap-2">
                                {hasVoted && (
                                  <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                )}
                                <span className="text-xs text-slate-500">{votes} phiếu ({percentage}%)</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-3 text-right">
                      <span className="text-[10px] text-slate-400">Tạo bởi #{poll.CreatedByUserId} • {new Date(poll.CreatedAt).toLocaleString('vi-VN')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {!isCreating && (
          <div className="p-4 border-t border-slate-100 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <button 
              onClick={() => setIsCreating(true)}
              className="w-full py-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 font-semibold rounded-xl transition-colors border border-emerald-200 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Tạo bình chọn mới
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
