import { create } from 'zustand';

interface OnlineStore {
  onlineUserIds: string[];
  setOnlineUserIds: (ids: string[]) => void;
  addOnlineUserId: (id: string) => void;
  removeOnlineUserId: (id: string) => void;
}

export const useOnlineStore = create<OnlineStore>((set) => ({
  onlineUserIds: [],
  setOnlineUserIds: (ids) => set({ onlineUserIds: ids }),
  addOnlineUserId: (id) => set((state) => ({ 
    onlineUserIds: state.onlineUserIds.includes(id) ? state.onlineUserIds : [...state.onlineUserIds, id] 
  })),
  removeOnlineUserId: (id) => set((state) => ({ 
    onlineUserIds: state.onlineUserIds.filter((x) => x !== id) 
  })),
}));
