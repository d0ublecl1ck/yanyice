import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { ModuleType } from "@/lib/types";

type ModulePins = Record<ModuleType, string[]>;

function emptyPins(): ModulePins {
  return { liuyao: [], bazi: [] };
}

interface PinnedRecordState {
  pinnedByUser: Record<string, ModulePins>;

  togglePin: (args: { userId: string; module: ModuleType; recordId: string }) => void;
  unpin: (args: { userId: string; module: ModuleType; recordId: string }) => void;
}

export const usePinnedRecordStore = create<PinnedRecordState>()(
  persist(
    (set, get) => ({
      pinnedByUser: {},

      togglePin: ({ userId, module, recordId }) => {
        const nextUserId = userId || "anon";
        const current = get().pinnedByUser[nextUserId] ?? emptyPins();
        const ids = current[module] ?? [];
        const isPinned = ids.includes(recordId);
        const nextIds = isPinned ? ids.filter((id) => id !== recordId) : [recordId, ...ids];

        set((state) => ({
          pinnedByUser: {
            ...state.pinnedByUser,
            [nextUserId]: { ...current, [module]: nextIds },
          },
        }));
      },

      unpin: ({ userId, module, recordId }) => {
        const nextUserId = userId || "anon";
        const current = get().pinnedByUser[nextUserId];
        if (!current) return;
        const ids = current[module] ?? [];
        if (!ids.includes(recordId)) return;

        set((state) => ({
          pinnedByUser: {
            ...state.pinnedByUser,
            [nextUserId]: { ...current, [module]: ids.filter((id) => id !== recordId) },
          },
        }));
      },
    }),
    {
      name: "yanyice-pinned-records",
    },
  ),
);

