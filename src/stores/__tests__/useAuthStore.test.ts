import { afterAll, beforeAll, afterEach, beforeEach, test, expect } from "bun:test";

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
const originalFetch = globalThis.fetch;

beforeAll(() => {
  Object.defineProperty(globalThis, "localStorage", { value: memoryLocalStorage, configurable: true });
});

afterAll(() => {
  globalThis.fetch = originalFetch;
  if (originalLocalStorage === undefined) {
    try {
      delete (globalThis as unknown as { localStorage?: unknown }).localStorage;
    } catch {
      Object.defineProperty(globalThis, "localStorage", { value: undefined, configurable: true });
    }
    return;
  }
  Object.defineProperty(globalThis, "localStorage", { value: originalLocalStorage, configurable: true });
});

beforeEach(() => {
  memoryLocalStorage.clear();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  delete process.env.NEXT_PUBLIC_API_BASE_URL;
});

test("useAuthStore bootstraps during rehydrate without TDZ self-reference", async () => {
  memoryLocalStorage.setItem("yanyice-auth", JSON.stringify({ state: { accessToken: null }, version: 0 }));

  const { useAuthStore } = await import("../useAuthStore");

  await new Promise((resolve) => setTimeout(resolve, 0));

  expect(useAuthStore.getState().hasHydrated).toBe(true);
  expect(useAuthStore.getState().status).toBe("unauthenticated");
});

test("login failure reverts status from loading", async () => {
  process.env.NEXT_PUBLIC_API_BASE_URL = "http://example.test";

  globalThis.fetch = async () => {
    return new Response(JSON.stringify({ code: "INVALID_CREDENTIALS", message: "账号或密码错误" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  };

  const { useAuthStore } = await import("../useAuthStore");
  useAuthStore.setState({ user: null, accessToken: null, status: "unauthenticated", hasHydrated: true });

  const promise = useAuthStore.getState().login("u@example.com", "wrong").catch(() => undefined);
  expect(useAuthStore.getState().status).toBe("loading");
  await promise;
  expect(useAuthStore.getState().status).toBe("unauthenticated");
});
