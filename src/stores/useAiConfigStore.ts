import { create } from "zustand";
import { persist } from "zustand/middleware";

import { getDefaultAiConfig, type AiConfig } from "@/lib/aiConfig";

interface AiConfigState extends AiConfig {
  hasHydrated: boolean;
  setHasHydrated: (hasHydrated: boolean) => void;
  setVendor: (vendor: string) => void;
  setModel: (model: string) => void;
  reset: () => void;
}

export const useAiConfigStore = create<AiConfigState>()(
  persist(
    (set) => ({
      ...getDefaultAiConfig(),
      hasHydrated: false,
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      setVendor: (vendor) => set({ vendor }),
      setModel: (model) => set({ model }),
      reset: () => set(getDefaultAiConfig()),
    }),
    {
      name: "yanyice-ai-config",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

