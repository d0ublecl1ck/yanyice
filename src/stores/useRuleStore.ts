import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Rule } from "@/lib/types";
import { ApiError, apiFetch } from "@/lib/apiClient";
import { useAuthStore } from "@/stores/useAuthStore";

type LoadStatus = "idle" | "loading" | "ready" | "error";

interface RuleState {
  rules: Rule[];
  status: LoadStatus;
  hasHydrated: boolean;
  hasLoaded: boolean;
  loadedForUserId: string | null;

  setHasHydrated: (hasHydrated: boolean) => void;
  bootstrap: () => Promise<void>;
  refreshRules: (params?: { module?: Rule["module"] }) => Promise<void>;

  addRule: (rule: Omit<Rule, "id">) => Promise<string>;
  updateRule: (id: string, updates: Partial<Rule>) => Promise<void>;
  deleteRule: (id: string) => Promise<void>;
}

function getAuthContext() {
  const { accessToken, user, status } = useAuthStore.getState();
  if (status !== "authenticated" || !accessToken || !user) return null;
  return { accessToken, userId: user.id };
}

function isUnauthorized(err: unknown): boolean {
  return err instanceof ApiError && err.status === 401;
}

export const useRuleStore = create<RuleState>()(
  persist(
    (set, get) => ({
      rules: [],
      status: "idle",
      hasHydrated: false,
      hasLoaded: false,
      loadedForUserId: null,

      setHasHydrated: (hasHydrated) => set({ hasHydrated }),

      bootstrap: async () => {
        const auth = getAuthContext();
        if (!auth) {
          set({ rules: [], status: "idle", hasLoaded: false, loadedForUserId: null });
          return;
        }

        if (get().loadedForUserId !== auth.userId) {
          set({ rules: [], loadedForUserId: auth.userId, status: "idle", hasLoaded: false });
        }

        await get().refreshRules();
        set({ hasLoaded: true });
      },

      refreshRules: async (params) => {
        const auth = getAuthContext();
        if (!auth) {
          set({ rules: [], status: "idle", hasLoaded: false, loadedForUserId: null });
          return;
        }

        const prev = get();
        set({ status: "loading" });
        try {
          const query = params?.module ? `?module=${encodeURIComponent(params.module)}` : "";
          const { rules } = await apiFetch<{ rules: Rule[] }>(`/api/rules${query}`, {
            method: "GET",
            accessToken: auth.accessToken,
          });
          set({ rules, status: "ready" });
        } catch (err) {
          if (isUnauthorized(err)) {
            set({ rules: [], status: "idle", hasLoaded: false, loadedForUserId: null });
            return;
          }
          set({ rules: prev.rules, status: "error" });
          throw err;
        }
      },

      addRule: async (rule) => {
        const auth = getAuthContext();
        if (!auth) throw new Error("未登录");

        const { rule: created } = await apiFetch<{ rule: Rule }>("/api/rules", {
          method: "POST",
          accessToken: auth.accessToken,
          body: JSON.stringify(rule),
        });

        set((state) => ({ rules: [created, ...state.rules] }));
        return created.id;
      },

      updateRule: async (id, updates) => {
        const auth = getAuthContext();
        if (!auth) throw new Error("未登录");

        const { rule } = await apiFetch<{ rule: Rule }>(`/api/rules/${encodeURIComponent(id)}`, {
          method: "PUT",
          accessToken: auth.accessToken,
          body: JSON.stringify(updates),
        });

        set((state) => ({
          rules: state.rules.map((r) => (r.id === id ? rule : r)),
        }));
      },

      deleteRule: async (id) => {
        const auth = getAuthContext();
        if (!auth) throw new Error("未登录");

        await apiFetch<null>(`/api/rules/${encodeURIComponent(id)}`, {
          method: "DELETE",
          accessToken: auth.accessToken,
        });

        set((state) => ({
          rules: state.rules.filter((r) => r.id !== id),
        }));
      },
    }),
    {
      name: "yanyice-rules",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        void state?.bootstrap();
      },
      partialize: (state) => ({
        rules: state.rules,
        loadedForUserId: state.loadedForUserId,
      }),
    },
  ),
);

