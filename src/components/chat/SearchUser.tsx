import React, { useState } from 'react';
import { AxiosError } from 'axios';
// import { userApi } from '../../api/user.api'; // Giả định import
import type { User } from '../../types/user.type';
import { Input } from '../common/Input';

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
      // Giả sử API tồn tại: 
      // const res = await userApi.searchUsers(value);
      // setUsers(res.data);
    } catch (err: unknown) {
      if (err instanceof AxiosError) console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-full">
      <Input 
        placeholder="Nhập email hoặc tên để tìm..." 
        value={query}
        onChange={handleSearch}
        className="mb-0"
      />
      {isLoading && <div className="absolute right-3 top-3 text-sm text-gray-400">Đang tìm...</div>}
      
      {users.length > 0 && (
        <ul className="absolute z-20 w-full bg-white border rounded shadow-lg mt-1 max-h-48 overflow-y-auto">
          {users.map(user => (
            <li 
              key={user.UserId} 
              onClick={() => {
                onSelectUser(user);
                setQuery('');
                setUsers([]);
              }}
              className="p-3 hover:bg-gray-100 cursor-pointer flex items-center gap-2 border-b last:border-0"
            >
              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                {user.FullName.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-800">{user.FullName}</span>
                <span className="text-xs text-gray-500">{user.Email}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};