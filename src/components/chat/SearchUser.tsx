import React, { useState } from 'react';
import { AxiosError } from 'axios';
import { userApi } from '../../api/user.api';
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
      const res = await userApi.searchUsers(value);
      setUsers((res.data as unknown as { data?: SearchUsersResponse }).data?.users || []);
    } catch (err: unknown) {
      if (err instanceof AxiosError) console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        id="search-user-input"
        type="text"
        placeholder="Tìm kiếm người dùng..."
        value={query}
        onChange={handleSearch}
        className="sidebar-search-input"
        autoComplete="off"
      />
      {isLoading && (
        <span className="search-loading">Đang tìm...</span>
      )}

      {users.length > 0 && (
        <ul className="search-dropdown" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {users.map(user => (
            <li
              key={user._id}
              id={`search-result-${user._id}`}
              onClick={() => {
                onSelectUser(user);
                setQuery('');
                setUsers([]);
              }}
              className="search-dropdown-item"
            >
              <div className="search-item-avatar">
                {user.fullName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="search-item-name">{user.fullName}</div>
                <div className="search-item-email">{user.email}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};