import React, { useEffect, useState } from 'react';
import { noteApi } from '../../api/group.api';
import type { GroupNote } from '../../types/group.type';
import { useAuthStore } from '../../store/auth.store';

interface NoteMessageItemProps {
  noteId: string;
  conversationId: string;
}

export const NoteMessageItem: React.FC<NoteMessageItemProps> = ({ noteId, conversationId }) => {
  const { user } = useAuthStore();
  const [note, setNote] = useState<GroupNote | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNote = async () => {
    try {
      setIsLoading(true);
      const res = await noteApi.getNotes(conversationId);
      const notes = (res.data as any).data || res.data || [];
      const foundNote = notes.find((n: GroupNote) => n.NoteId === noteId);
      if (foundNote) {
        setNote(foundNote);
      }
    } catch (error) {
      console.error('Failed to fetch note', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNote();
  }, [noteId, conversationId]);

  if (isLoading) {
    return (
      <div className="w-full max-w-[280px] bg-white border border-slate-200 rounded-2xl p-4 shadow-sm animate-pulse mx-auto my-2">
        <div className="h-4 bg-slate-200 rounded w-1/3 mb-4"></div>
        <div className="h-16 bg-slate-100 rounded-lg"></div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="w-full flex justify-center my-4 animate-fade-in-up">
        <div className="bg-slate-50 border border-slate-200 text-slate-500 px-4 py-2 rounded-xl text-sm font-medium shadow-sm">
          Ghi chú không tồn tại hoặc đã bị xóa.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center my-4 animate-fade-in-up">
      <div className="w-full max-w-[320px] bg-white border border-amber-100 rounded-3xl shadow-lg shadow-amber-500/10 overflow-hidden relative">
        <div className="bg-gradient-to-r from-amber-400 to-orange-400 px-5 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2 text-white/90">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2-2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            <span className="text-[11px] font-bold uppercase tracking-wider">Ghi chú nhóm</span>
          </div>
          <button onClick={fetchNote} className="text-white/80 hover:text-white p-1" title="Làm mới">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
        </div>
        
        <div className="p-4 bg-white/50 backdrop-blur-md">
          <div className="bg-amber-50/50 rounded-xl p-3 border border-amber-100/50">
            <p className="text-slate-800 text-[14px] whitespace-pre-wrap leading-relaxed">
              {note.Content}
            </p>
          </div>
          <div className="mt-3 flex justify-end">
            <span className="text-[10px] text-slate-400">
              Tạo bởi #{note.CreatedByUserId} • {new Date(note.CreatedAt).toLocaleString('vi-VN')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
