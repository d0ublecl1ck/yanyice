import { describe, expect, test } from "bun:test";

type MemoryStorage = Pick<Storage, "getItem" | "setItem" | "removeItem" | "clear" | "key" | "length">;

const createMemoryStorage = (): MemoryStorage => {
  const map = new Map<string, string>();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, String(value));
    },
    removeItem: (key) => {
      map.delete(key);
    },
    clear: () => {
      map.clear();
    },
    key: (index) => Array.from(map.keys())[index] ?? null,
    get length() {
      return map.size;
    },
  };
};

let cached: { useUIStore: typeof import("../useUIStore").useUIStore; storage: MemoryStorage } | null = null;

const init = async () => {
  if (cached) return cached;

  const storage = createMemoryStorage();
  Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true });

  const { useUIStore } = await import("../useUIStore");
  cached = { useUIStore, storage };
  return cached;
};

describe("useUIStore", () => {
  test("toggles sidebar collapsed state and persists", async () => {
    const { useUIStore, storage } = await init();

    await useUIStore.persist?.clearStorage?.();
    useUIStore.setState({ isSidebarCollapsed: false });

    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().isSidebarCollapsed).toBe(true);

    const raw = storage.getItem("yanyice-ui-state");
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw!).state.isSidebarCollapsed).toBe(true);
  });
});

