import { create } from "zustand";
import { persist } from "zustand/middleware";

import { ApiError, apiFetch } from "@/lib/apiClient";
import {
  createLiuyaoRecord,
  deleteLiuyaoRecord,
  listLiuyaoRecords,
  updateLiuyaoRecord,
  type LiuyaoRecordPayload,
} from "@/lib/liuyaoApi";
import type { ConsultationRecord } from "@/lib/types";
import { useAuthStore } from "@/stores/useAuthStore";

type LoadStatus = "idle" | "loading" | "ready" | "error";

interface CaseState {
  records: ConsultationRecord[];
  status: LoadStatus;
  hasHydrated: boolean;
  loadedForUserId: string | null;

  setHasHydrated: (hasHydrated: boolean) => void;
  bootstrap: () => Promise<void>;
  refresh: () => Promise<void>;

  addRecord: (record: Omit<ConsultationRecord, "id" | "createdAt" | "pinnedAt">) => Promise<string>;
  updateRecord: (id: string, updates: Partial<ConsultationRecord>) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;

  syncLiuyaoFromApi: (accessToken: string) => Promise<void>;
  upsertLiuyaoRemote: (
    accessToken: string,
    args: { id?: string; payload: LiuyaoRecordPayload | Partial<LiuyaoRecordPayload> },
  ) => Promise<string>;
  deleteLiuyaoRemote: (accessToken: string, id: string) => Promise<void>;
}

function getAuthContext() {
  const { accessToken, user, status } = useAuthStore.getState();
  if (status !== "authenticated" || !accessToken || !user) return null;
  return { accessToken, userId: user.id };
}

function isUnauthorized(err: unknown): boolean {
  return err instanceof ApiError && err.status === 401;
}

export const useCaseStore = create<CaseState>()(
  persist(
    (set, get) => ({
      records: [],
      status: "idle",
      hasHydrated: false,
      loadedForUserId: null,

      setHasHydrated: (hasHydrated) => set({ hasHydrated }),

      bootstrap: async () => {
        const auth = getAuthContext();
        if (!auth) {
          set({ records: [], status: "idle", loadedForUserId: null });
          return;
        }

        if (get().loadedForUserId !== auth.userId) {
          set({ records: [], loadedForUserId: auth.userId, status: "idle" });
        }

        await get().refresh();
      },

      refresh: async () => {
        const auth = getAuthContext();
        if (!auth) return;

        set({ status: "loading" });
        try {
          const { records } = await apiFetch<{ records: ConsultationRecord[] }>("/api/records", {
            method: "GET",
            accessToken: auth.accessToken,
          });
          set({ records, status: "ready" });
        } catch (err) {
          if (isUnauthorized(err)) {
            set({ records: [], status: "idle", loadedForUserId: null });
            return;
          }
          set({ status: "error" });
        }
      },

      addRecord: async (record) => {
        const auth = getAuthContext();
        if (!auth) throw new Error("未登录");

        const { record: created } = await apiFetch<{ record: ConsultationRecord }>("/api/records", {
          method: "POST",
          accessToken: auth.accessToken,
          body: JSON.stringify(record),
        });

        set((state) => ({ records: [...state.records, created] }));
        return created.id;
      },

      updateRecord: async (id, updates) => {
        const auth = getAuthContext();
        if (!auth) throw new Error("未登录");

        const { record: updated } = await apiFetch<{ record: ConsultationRecord }>(
          `/api/records/${encodeURIComponent(id)}`,
          {
            method: "PUT",
            accessToken: auth.accessToken,
            body: JSON.stringify(updates),
          },
        );

        set((state) => ({
          records: state.records.map((r) => (r.id === id ? updated : r)),
        }));
      },

      deleteRecord: async (id) => {
        const auth = getAuthContext();
        if (!auth) throw new Error("未登录");

        await apiFetch<null>(`/api/records/${encodeURIComponent(id)}`, {
          method: "DELETE",
          accessToken: auth.accessToken,
        });

        set((state) => ({ records: state.records.filter((r) => r.id !== id) }));
      },

      syncLiuyaoFromApi: async (accessToken) => {
        const remote = await listLiuyaoRecords(accessToken);
        set((state) => ({
          records: [...state.records.filter((r) => r.module !== "liuyao"), ...remote],
        }));
      },

      upsertLiuyaoRemote: async (accessToken, args) => {
        const record = args.id
          ? await updateLiuyaoRecord(accessToken, args.id, args.payload)
          : await createLiuyaoRecord(accessToken, args.payload as LiuyaoRecordPayload);

        set((state) => {
          const rest = state.records.filter((r) => r.id !== record.id);
          return { records: [...rest, record] };
        });
        return record.id;
      },

      deleteLiuyaoRemote: async (accessToken, id) => {
        await deleteLiuyaoRecord(accessToken, id);
        set((state) => ({ records: state.records.filter((r) => r.id !== id) }));
      },
    }),
    {
      name: "yanyice-records",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        void state?.bootstrap();
      },
      partialize: (state) => ({
        records: state.records,
        loadedForUserId: state.loadedForUserId,
      }),
    },
  ),
);
