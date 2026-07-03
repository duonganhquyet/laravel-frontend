import React, { useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { noteApi, mapNote } from '../../api/group.api';
import type { GroupNote } from '../../types/group.type';

interface GroupNotesProps {
  conversationId: string;
}

export const GroupNotes: React.FC<GroupNotesProps> = ({ conversationId }) => {
  const [notes, setNotes] = useState<GroupNote[]>([]);
  const [newNote, setNewNote] = useState<string>('');

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const res = await noteApi.getNotes(conversationId);
        const rawNotes = (res.data as any).data || res.data || [];
        setNotes(rawNotes.map(mapNote));
      } catch (err: unknown) {
        console.error(err instanceof AxiosError ? err.response?.data : err);
      }
    };
    fetchNotes();
  }, [conversationId]);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    try {
      const res = await noteApi.createNote(conversationId, newNote);
      const mapped = mapNote((res.data as any).data || res.data);
      setNotes([mapped, ...notes]);
      setNewNote('');
      window.dispatchEvent(new CustomEvent('notes-updated', { detail: { conversationId } }));
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        alert(err.response?.data?.message || 'Lỗi khi thêm ghi chú.');
      }
    }
  };

  return (
    <div className="p-4 bg-yellow-50 rounded border border-yellow-200">
      <h3 className="font-bold text-yellow-800 mb-2 text-sm">Ghi chú nhóm</h3>
      <div className="flex gap-2 mb-4">
        <input 
          value={newNote} 
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewNote(e.target.value)} 
          className="flex-1 p-1 text-sm border rounded"
          placeholder="Thêm ghi chú..."
        />
        <button onClick={handleAddNote} className="bg-yellow-500 text-white px-3 text-sm rounded">Lưu</button>
      </div>
      <ul className="space-y-2 text-sm">
        {notes.map(note => (
          <li key={note.id} className="bg-white p-2 rounded shadow-sm border border-yellow-100">
            {note.content}
          </li>
        ))}
      </ul>
    </div>
  );
};