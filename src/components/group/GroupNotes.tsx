import React, { useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { noteApi } from '../../api/group.api';
import type { GroupNote } from '../../types/group.type';

interface GroupNotesProps {
  conversationId: number;
}

export const GroupNotes: React.FC<GroupNotesProps> = ({ conversationId }) => {
  const [notes, setNotes] = useState<GroupNote[]>([]);
  const [newNote, setNewNote] = useState<string>('');

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const res = await noteApi.getNotes(conversationId);
        setNotes(res.data);
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
      setNotes([res.data, ...notes]);
      setNewNote('');
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
          <li key={note.NoteId} className="bg-white p-2 rounded shadow-sm border border-yellow-100">
            {note.Content}
          </li>
        ))}
      </ul>
    </div>
  );
};