import { create } from "zustand";

import { ApiError, apiFetch } from "@/lib/apiClient";
import { getDefaultAiConfig } from "@/lib/aiConfig";
import { useAuthStore } from "@/stores/useAuthStore";

type LoadStatus = "idle" | "loading" | "ready" | "error";

type ServerAiConfig = {
  vendor: "zhipu";
  model: string;
  hasApiKey: boolean;
};

interface AiConfigState {
  vendor: string;
  model: string;
  hasApiKey: boolean;
  status: LoadStatus;

  bootstrap: () => Promise<void>;
  updateModel: (model: string) => Promise<void>;
  saveApiKey: (apiKey: string) => Promise<void>;
  clearApiKey: () => Promise<void>;
}

function getAuthContext() {
  const { accessToken, user, status } = useAuthStore.getState();
  if (status !== "authenticated" || !accessToken || !user) return null;
  return { accessToken, userId: user.id };
}

function isUnauthorized(err: unknown): boolean {
  return err instanceof ApiError && err.status === 401;
}

const DEFAULT = getDefaultAiConfig();

export const useAiConfigStore = create<AiConfigState>((set, get) => ({
  vendor: DEFAULT.vendor,
  model: DEFAULT.model,
  hasApiKey: false,
  status: "idle",

  bootstrap: async () => {
    const auth = getAuthContext();
    if (!auth) {
      set({ vendor: DEFAULT.vendor, model: DEFAULT.model, hasApiKey: false, status: "idle" });
      return;
    }

    const prev = get();
    set({ status: "loading" });
    try {
      const cfg = await apiFetch<ServerAiConfig>("/api/ai/config", {
        method: "GET",
        accessToken: auth.accessToken,
      });
      set({ vendor: cfg.vendor, model: cfg.model, hasApiKey: cfg.hasApiKey, status: "ready" });
    } catch (err) {
      if (isUnauthorized(err)) {
        set({ vendor: DEFAULT.vendor, model: DEFAULT.model, hasApiKey: false, status: "idle" });
        return;
      }
      set({ vendor: prev.vendor, model: prev.model, hasApiKey: prev.hasApiKey, status: "error" });
      throw err;
    }
  },

  updateModel: async (model) => {
    const auth = getAuthContext();
    if (!auth) throw new Error("未登录");
    const next = model.trim();

    const prev = get();
    set({ status: "loading" });
    try {
      const cfg = await apiFetch<ServerAiConfig>("/api/ai/config", {
        method: "PUT",
        accessToken: auth.accessToken,
        body: JSON.stringify({ model: next }),
      });
      set({ vendor: cfg.vendor, model: cfg.model, hasApiKey: cfg.hasApiKey, status: "ready" });
    } catch (err) {
      if (isUnauthorized(err)) {
        set({ vendor: DEFAULT.vendor, model: DEFAULT.model, hasApiKey: false, status: "idle" });
        return;
      }
      set({ vendor: prev.vendor, model: prev.model, hasApiKey: prev.hasApiKey, status: "error" });
      throw err;
    }
  },

  saveApiKey: async (apiKey) => {
    const auth = getAuthContext();
    if (!auth) throw new Error("未登录");
    const next = apiKey.trim();

    const prev = get();
    set({ status: "loading" });
    try {
      const cfg = await apiFetch<ServerAiConfig>("/api/ai/config", {
        method: "PUT",
        accessToken: auth.accessToken,
        body: JSON.stringify({ apiKey: next }),
      });
      set({ vendor: cfg.vendor, model: cfg.model, hasApiKey: cfg.hasApiKey, status: "ready" });
    } catch (err) {
      if (isUnauthorized(err)) {
        set({ vendor: DEFAULT.vendor, model: DEFAULT.model, hasApiKey: false, status: "idle" });
        return;
      }
      set({ vendor: prev.vendor, model: prev.model, hasApiKey: prev.hasApiKey, status: "error" });
      throw err;
    }
  },

  clearApiKey: async () => {
    const auth = getAuthContext();
    if (!auth) throw new Error("未登录");

    const prev = get();
    set({ status: "loading" });
    try {
      const cfg = await apiFetch<ServerAiConfig>("/api/ai/config", {
        method: "PUT",
        accessToken: auth.accessToken,
        body: JSON.stringify({ apiKey: "" }),
      });
      set({ vendor: cfg.vendor, model: cfg.model, hasApiKey: cfg.hasApiKey, status: "ready" });
    } catch (err) {
      if (isUnauthorized(err)) {
        set({ vendor: DEFAULT.vendor, model: DEFAULT.model, hasApiKey: false, status: "idle" });
        return;
      }
      set({ vendor: prev.vendor, model: prev.model, hasApiKey: prev.hasApiKey, status: "error" });
      throw err;
    }
  },
}));

