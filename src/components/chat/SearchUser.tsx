import React, { useState } from 'react';
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

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    if (value.length < 2) {
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

      {users.length > 0 && (
        <ul className="absolute z-10 w-[calc(100%-2rem)] mt-2 mx-auto bg-white rounded-xl shadow-xl border border-slate-100 max-h-80 overflow-auto divide-y divide-slate-100 overflow-hidden">
          {users.map(user => (
            <li
              key={user._id}
              id={`search-result-${user._id}`}
              onClick={() => {
                onSelectUser(user);
                setQuery('');
                setUsers([]);
              }}
              className="flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer transition-colors"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold shadow-sm">
                {user.fullName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-slate-800 truncate">{user.fullName}</div>
                <div className="text-xs text-slate-500 truncate">{user.email}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};