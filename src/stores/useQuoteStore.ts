import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Quote } from "@/lib/types";
import { ApiError, apiFetch } from "@/lib/apiClient";
import { useAuthStore } from "@/stores/useAuthStore";

type LoadStatus = "idle" | "loading" | "ready" | "error";

interface QuoteState {
  quotes: Quote[];
  status: LoadStatus;
  hasHydrated: boolean;
  hasLoaded: boolean;
  loadedForUserId: string | null;

  setHasHydrated: (hasHydrated: boolean) => void;
  bootstrap: () => Promise<void>;
  refreshQuotes: () => Promise<void>;

  addQuote: (text: string) => Promise<string>;
  updateQuote: (id: string, updates: Partial<Pick<Quote, "text" | "enabled">>) => Promise<void>;
  deleteQuote: (id: string) => Promise<void>;
  saveQuoteLines: (lines: string) => Promise<void>;
  resetSystemQuotes: () => Promise<void>;
}

function getAuthContext() {
  const { accessToken, user, status } = useAuthStore.getState();
  if (status !== "authenticated" || !accessToken || !user) return null;
  return { accessToken, userId: user.id };
}

function isUnauthorized(err: unknown): boolean {
  return err instanceof ApiError && err.status === 401;
}

export const useQuoteStore = create<QuoteState>()(
  persist(
    (set, get) => ({
      quotes: [],
      status: "idle",
      hasHydrated: false,
      hasLoaded: false,
      loadedForUserId: null,

      setHasHydrated: (hasHydrated) => set({ hasHydrated }),

      bootstrap: async () => {
        const auth = getAuthContext();
        if (!auth) {
          set({ quotes: [], status: "idle", hasLoaded: false, loadedForUserId: null });
          return;
        }

        if (get().loadedForUserId !== auth.userId) {
          set({ quotes: [], loadedForUserId: auth.userId, status: "idle", hasLoaded: false });
        }

        await get().refreshQuotes();
        set({ hasLoaded: true });
      },

      refreshQuotes: async () => {
        const auth = getAuthContext();
        if (!auth) {
          set({ quotes: [], status: "idle", hasLoaded: false, loadedForUserId: null });
          return;
        }

        const prev = get();
        set({ status: "loading" });
        try {
          const { quotes } = await apiFetch<{ quotes: Quote[] }>("/api/quotes", {
            method: "GET",
            accessToken: auth.accessToken,
          });
          set({ quotes, status: "ready" });
        } catch (err) {
          if (isUnauthorized(err)) {
            set({ quotes: [], status: "idle", hasLoaded: false, loadedForUserId: null });
            return;
          }
          set({ quotes: prev.quotes, status: "error" });
          throw err;
        }
      },

      addQuote: async (text) => {
        const auth = getAuthContext();
        if (!auth) throw new Error("未登录");

        const { quote } = await apiFetch<{ quote: Quote }>("/api/quotes", {
          method: "POST",
          accessToken: auth.accessToken,
          body: JSON.stringify({ text }),
        });

        set((state) => ({ quotes: [...state.quotes, quote] }));
        return quote.id;
      },

      updateQuote: async (id, updates) => {
        const auth = getAuthContext();
        if (!auth) throw new Error("未登录");

        const { quote } = await apiFetch<{ quote: Quote }>(`/api/quotes/${encodeURIComponent(id)}`, {
          method: "PUT",
          accessToken: auth.accessToken,
          body: JSON.stringify(updates),
        });

        set((state) => ({
          quotes: state.quotes.map((q) => (q.id === id ? quote : q)),
        }));
      },

      deleteQuote: async (id) => {
        const auth = getAuthContext();
        if (!auth) throw new Error("未登录");

        await apiFetch<null>(`/api/quotes/${encodeURIComponent(id)}`, {
          method: "DELETE",
          accessToken: auth.accessToken,
        });

        set((state) => ({
          quotes: state.quotes.filter((q) => q.id !== id),
        }));
      },

      saveQuoteLines: async (lines) => {
        const auth = getAuthContext();
        if (!auth) throw new Error("未登录");

        await apiFetch<null>("/api/quotes/bulk", {
          method: "PUT",
          accessToken: auth.accessToken,
          body: JSON.stringify({ lines }),
        });

        await get().refreshQuotes();
      },

      resetSystemQuotes: async () => {
        const auth = getAuthContext();
        if (!auth) throw new Error("未登录");

        await apiFetch<null>("/api/quotes/reset", {
          method: "POST",
          accessToken: auth.accessToken,
        });

        await get().refreshQuotes();
      },
    }),
    {
      name: "yanyice-quotes",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        void state?.bootstrap();
      },
      partialize: (state) => ({
        quotes: state.quotes,
        loadedForUserId: state.loadedForUserId,
      }),
    },
  ),
);
