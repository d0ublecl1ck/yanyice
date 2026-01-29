
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/lib/types';
import { apiFetch, ApiError } from '@/lib/apiClient';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  hasHydrated: boolean;
  setHasHydrated: (hasHydrated: boolean) => void;
  bootstrap: () => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      status: 'loading',
      hasHydrated: false,
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      bootstrap: async () => {
        set((s) => ({ status: s.accessToken ? 'loading' : 'unauthenticated' }));
        const accessToken = get().accessToken;
        if (!accessToken) {
          set({ user: null, status: 'unauthenticated' });
          return;
        }

        try {
          const { user } = await apiFetch<{ user: User }>('/api/auth/me', { method: 'GET', accessToken });
          set({ user, status: 'authenticated' });
        } catch (err) {
          if (err instanceof ApiError && err.status === 401) {
            set({ user: null, accessToken: null, status: 'unauthenticated' });
            return;
          }
          set({ status: 'unauthenticated' });
        }
      },
      register: async (email, password) => {
        const prev = get();
        set({ status: 'loading' });
        try {
          const { user, accessToken } = await apiFetch<{ user: User; accessToken: string }>('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
          });
          set({ user, accessToken, status: 'authenticated' });
        } catch (err) {
          set({ user: prev.user, accessToken: prev.accessToken, status: prev.status });
          throw err;
        }
      },
      login: async (email, password) => {
        const prev = get();
        set({ status: 'loading' });
        try {
          const { user, accessToken } = await apiFetch<{ user: User; accessToken: string }>('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
          });
          set({ user, accessToken, status: 'authenticated' });
        } catch (err) {
          set({ user: prev.user, accessToken: prev.accessToken, status: prev.status });
          throw err;
        }
      },
      logout: () => set({ user: null, accessToken: null, status: 'unauthenticated' }),
    }),
    {
      name: 'yanyice-auth',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        void state?.bootstrap();
      },
    }
  )
);
