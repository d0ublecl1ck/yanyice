
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/lib/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  setHasHydrated: (hasHydrated: boolean) => void;
  login: (username: string) => void;
  logout: () => void;
  updateSettings: (settings: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      hasHydrated: false,
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      login: (username) => set({ user: { username }, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
      updateSettings: (settings) => set((state) => ({
        user: state.user ? { ...state.user, ...settings } : null
      })),
    }),
    {
      name: 'yanyice-auth',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
