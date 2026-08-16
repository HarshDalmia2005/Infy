import { create } from 'zustand';

export interface User {
  id: string;
  identityId?: string;
  name: string;
  color: string;
  image?: string;
  cursor?: { x: number; y: number };
}

interface UserState {
  me: User | null;
  users: Record<string, User>;
  setMe: (user: User) => void;
  addUser: (user: User) => void;
  removeUser: (userId: string) => void;
  updateUserCursor: (userId: string, cursor: { x: number; y: number }) => void;
  setUsers: (users: Record<string, User>) => void;
}

export const useUserStore = create<UserState>((set) => ({
  me: null,
  users: {},
  setMe: (me) => set({ me }),
  addUser: (user) => set((state) => ({ users: { ...state.users, [user.id]: user } })),
  removeUser: (userId) => set((state) => {
    const newUsers = { ...state.users };
    delete newUsers[userId];
    return { users: newUsers };
  }),
  updateUserCursor: (userId, cursor) => set((state) => {
    if (!state.users[userId]) return state;
    return {
      users: {
        ...state.users,
        [userId]: { ...state.users[userId], cursor }
      }
    };
  }),
  setUsers: (users) => set({ users }),
}));
