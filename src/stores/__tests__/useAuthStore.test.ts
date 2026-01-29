import { beforeAll, afterAll, test, expect } from "bun:test";

type LocalStorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
};

function createMemoryLocalStorage(): LocalStorageLike {
  const store = new Map<string, string>();
  return {
    getItem(key) {
      return store.get(key) ?? null;
    },
    setItem(key, value) {
      store.set(key, value);
    },
    removeItem(key) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
  };
}

const originalLocalStorage = (globalThis as unknown as { localStorage?: unknown }).localStorage;
const memoryLocalStorage = createMemoryLocalStorage();

beforeAll(() => {
  (globalThis as unknown as { localStorage: LocalStorageLike }).localStorage = memoryLocalStorage;
});

afterAll(() => {
  if (originalLocalStorage === undefined) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).localStorage;
    return;
  }
  (globalThis as unknown as { localStorage: unknown }).localStorage = originalLocalStorage;
});

test("useAuthStore bootstraps during rehydrate without TDZ self-reference", async () => {
  memoryLocalStorage.setItem("yanyice-auth", JSON.stringify({ state: { accessToken: null }, version: 0 }));

  const { useAuthStore } = await import("../useAuthStore");

  await new Promise((resolve) => setTimeout(resolve, 0));

  expect(useAuthStore.getState().hasHydrated).toBe(true);
  expect(useAuthStore.getState().status).toBe("unauthenticated");
});

