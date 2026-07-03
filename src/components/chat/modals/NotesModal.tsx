import React, { useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { noteApi, mapNote } from '../../../api/group.api';
import type { GroupNote } from '../../../types/group.type';
import { useAuthStore } from '../../../store/auth.store';
import { useConfirmStore } from '../../../store/confirm.store';
import { useToastStore } from '../../../store/toast.store';

interface NotesModalProps {
  conversationId: string;
  onClose: () => void;
}

export const NotesModal: React.FC<NotesModalProps> = ({ conversationId, onClose }) => {
  const { user } = useAuthStore();
  const [notes, setNotes] = useState<GroupNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchNotes = async () => {
    setIsLoading(true);
    try {
      const res = await noteApi.getNotes(conversationId);
      const rawNotes = (res.data as any).data || res.data || [];
      setNotes(rawNotes.map(mapNote));
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || 'Không thể tải ghi chú');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [conversationId]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setIsSubmitting(true);
    try {
      await noteApi.createNote(conversationId, newNote);
      setNewNote('');
      fetchNotes();
      window.dispatchEvent(new CustomEvent('notes-updated', { detail: { conversationId } }));
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || 'Không thể tạo ghi chú');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNote = async (noteId: string | number) => {
    const confirmed = await useConfirmStore.getState().show({
      title: 'Xóa ghi chú',
      message: 'Bạn có chắc muốn xóa ghi chú này?',
      confirmText: 'Xóa',
    });
    if (!confirmed) return;
    try {
      await noteApi.deleteNote(noteId.toString());
      setNotes(notes.filter(n => n.id.toString() !== noteId.toString()));
      useToastStore.getState().success('Đã xóa ghi chú thành công');
      window.dispatchEvent(new CustomEvent('notes-updated', { detail: { conversationId } }));
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        useToastStore.getState().error(err.response?.data?.message || 'Không thể xóa ghi chú');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/50 backdrop-blur-sm transition-opacity">
      <div className="bg-white shadow-2xl w-full max-w-md h-full flex flex-col transform transition-transform animate-slide-in-right">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-amber-50">
          <h2 className="text-lg font-bold text-amber-800 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            Ghi chú nhóm
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-amber-100 rounded-full transition-colors text-amber-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Body - Notes List */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50">
          {error && <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">{error}</div>}
          
          {isLoading ? (
            <div className="flex justify-center items-center h-32 text-slate-400">
              <svg className="animate-spin h-6 w-6 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            </div>
          ) : notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <div className="w-12 h-12 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              </div>
              <p className="text-slate-500 font-medium">Chưa có ghi chú nào</p>
              <p className="text-slate-400 text-sm mt-1">Ghim những thông tin quan trọng vào đây</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notes.map(note => (
                <div key={note.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 group">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md flex items-center gap-1.5">
                      {note.creatorAvatar && (
                        <img 
                          src={note.creatorAvatar} 
                          alt={note.creatorName || "avatar"} 
                          className="w-4.5 h-4.5 rounded-full object-cover shrink-0" 
                        />
                      )}
                      {note.creatorName || `Người dùng #${note.createdByUserId}`}
                    </span>
                    {user && (user._id === note.createdByUserId.toString() || user.id === note.createdByUserId) && (
                      <button 
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Xóa ghi chú"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    )}
                  </div>
                  <p className="text-slate-800 text-sm whitespace-pre-wrap leading-relaxed">{note.content}</p>
                  <p className="text-[10px] text-slate-400 mt-3 text-right">
                    {new Date(note.createdAt).toLocaleString('vi-VN')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer - Add Note Form */}
        <form onSubmit={handleAddNote} className="p-4 border-t border-slate-100 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="relative">
            <textarea 
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Nhập ghi chú mới..."
              rows={2}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all text-sm resize-none custom-scrollbar pr-12"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAddNote(e);
                }
              }}
            />
            <button 
              type="submit"
              disabled={isSubmitting || !newNote.trim()}
              className="absolute right-2 bottom-2 p-2 text-white bg-amber-500 hover:bg-amber-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 text-center">Nhấn Enter để thêm ghi chú</p>
        </form>
      </div>
    </div>
  );
};
