import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthModalOpen: boolean;
  setToken: (token: string) => void;
  setUser: (user: User) => void;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthModalOpen: false,
      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),
      openAuthModal: () => set({ isAuthModalOpen: true }),
      closeAuthModal: () => set({ isAuthModalOpen: false }),
      logout: () => set({ token: null, user: null }),
    }),
    { 
      name: 'auth-storage',
    }
  )
);