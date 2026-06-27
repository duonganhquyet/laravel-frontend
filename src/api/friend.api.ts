import type { User } from '../types/user.type';
import { api } from '../lib/axios';

export type FriendStatus = 'none' | 'pending_sent' | 'pending_received' | 'friends';

export interface FriendRequest {
  id: string;
  sender: User;
  createdAt: string;
}

export const friendApi = {
  getFriends: async (): Promise<User[]> => {
    const res = await api.get('/friend');
    return res.data?.data || res.data;
  },

  getFriendRequests: async (): Promise<FriendRequest[]> => {
    const res = await api.get('/friend/requests');
    const rawData = res.data?.data || res.data || [];
    return rawData.map((item: any) => ({
      id: item._id,
      sender: item.requester || item.sender,
      createdAt: item.createdAt
    }));
  },

  checkFriendStatus: async (targetUserId: string): Promise<FriendStatus> => {
    const res = await api.get(`/friend/status/${targetUserId}`);
    return res.data?.status || res.data?.data?.status || 'none';
  },

  sendFriendRequest: async (targetUserId: string): Promise<void> => {
    await api.post('/friend/add', { recipientId: targetUserId });
  },

  acceptRequest: async (requestId: string): Promise<void> => {
    await api.post('/friend/accept', { requestId });
  },

  rejectRequest: async (requestId: string): Promise<void> => {
    await api.post('/friend/decline', { requestId });
  },

  unfriend: async (friendId: string): Promise<void> => {
    await api.delete(`/friend/${friendId}`);
  },

  cancelRequest: async (targetUserId: string): Promise<void> => {
    await api.post('/friend/cancel', { recipientId: targetUserId });
  }
};
