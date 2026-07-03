import React, { useState, useEffect } from 'react';
import { AxiosError } from 'axios';
import { searchApi } from '../../api/search.api';
import type { User } from '../../types/user.type';

interface SearchUsersResponse {
  users: User[];
}

interface SearchUserProps {
  onSelectUser: (user: User) => void;
}

export const SearchUser: React.FC<SearchUserProps> = ({ onSelectUser }) => {
  const [query, setQuery] = useState<string>('');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const [history, setHistory] = useState<User[]>([]);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('chatweb_search_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const saveToHistory = (user: User) => {
    setHistory(prev => {
      const newHistory = [user, ...prev.filter(u => u._id !== user._id)].slice(0, 5);
      localStorage.setItem('chatweb_search_history', JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const clearHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory([]);
    localStorage.removeItem('chatweb_search_history');
  };

  const removeHistoryItem = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    setHistory(prev => {
      const newHistory = prev.filter(u => u._id !== userId);
      localStorage.setItem('chatweb_search_history', JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    if (value.trim().length < 2) {
      setUsers([]);
      return;
    }

    setIsLoading(true);
    try {
      const res = await searchApi.searchUsers(value);
      setUsers((res.data as unknown as { data?: SearchUsersResponse }).data?.users || []);
    } catch (err: unknown) {
      if (err instanceof AxiosError) console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (user: User) => {
    saveToHistory(user);
    onSelectUser(user);
    setQuery('');
    setUsers([]);
    setIsFocused(false);
  };

  return (
    <div className="relative w-full px-4 pt-4 pb-2">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
        </div>
        <input
          id="search-user-input"
          type="text"
          placeholder="Tìm kiếm người dùng..."
          value={query}
          onChange={handleSearch}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all shadow-inner"
          autoComplete="off"
        />
      </div>
      
      {isLoading && (
        <div className="absolute z-10 w-[calc(100%-2rem)] mt-2 mx-auto bg-white rounded-xl shadow-lg border border-slate-100 p-4 text-center">
          <span className="text-sm text-slate-500 flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            Đang tìm kiếm...
          </span>
        </div>
      )}

      {/* Hiển thị kết quả tìm kiếm */}
      {query.trim().length >= 2 && users.length > 0 && isFocused && (
        <ul className="absolute z-10 w-[calc(100%-2rem)] mt-2 mx-auto bg-white rounded-xl shadow-xl border border-slate-100 max-h-80 overflow-auto divide-y divide-slate-100">
          {users.map(user => (
            <li
              key={user._id}
              onMouseDown={() => handleSelect(user)}
              className="flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer transition-colors"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold shadow-sm overflow-hidden">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.fullName} className="w-full h-full object-cover" />
                ) : (
                  user.fullName.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-slate-800 truncate">{user.fullName}</div>
                <div className="text-xs text-slate-500 truncate">{user.email}</div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Hiển thị lịch sử tìm kiếm */}
      {query.trim().length === 0 && history.length > 0 && isFocused && (
        <div className="absolute z-10 w-[calc(100%-2rem)] mt-2 mx-auto bg-white rounded-xl shadow-xl border border-slate-100 max-h-80 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 bg-slate-50">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Lịch sử tìm kiếm</span>
            <button 
              onMouseDown={clearHistory}
              className="text-xs text-slate-400 hover:text-red-500 transition-colors"
            >
              Xóa tất cả
            </button>
          </div>
          <ul className="overflow-auto divide-y divide-slate-50">
            {history.map(user => (
              <li
                key={user._id}
                onMouseDown={() => handleSelect(user)}
                className="flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer transition-colors group"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-tr from-slate-200 to-slate-300 flex items-center justify-center text-slate-600 font-bold shadow-sm overflow-hidden ring-1 ring-black/5">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.fullName} className="w-full h-full object-cover" />
                  ) : (
                    user.fullName.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-slate-700 truncate group-hover:text-blue-600 transition-colors">{user.fullName}</div>
                </div>
                <button 
                  onMouseDown={(e) => removeHistoryItem(e, user._id)}
                  className="p-1.5 text-slate-300 hover:text-slate-500 hover:bg-slate-200 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                  title="Xóa khỏi lịch sử"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};