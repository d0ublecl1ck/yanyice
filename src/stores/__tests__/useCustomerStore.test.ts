import { afterAll, afterEach, beforeAll, beforeEach, expect, test } from "bun:test";

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
  (globalThis as unknown as { localStorage: LocalStorageLike }).localStorage = memoryLocalStorage;
});

afterAll(() => {
  globalThis.fetch = originalFetch;
  if (originalLocalStorage === undefined) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).localStorage;
    return;
  }
  (globalThis as unknown as { localStorage: unknown }).localStorage = originalLocalStorage;
});

beforeEach(() => {
  memoryLocalStorage.clear();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  delete process.env.NEXT_PUBLIC_API_BASE_URL;
});

test("bootstrap loads customers once authenticated", async () => {
  process.env.NEXT_PUBLIC_API_BASE_URL = "http://example.test";

  globalThis.fetch = async (input, init) => {
    const url = String(input);
    const method = (init?.method ?? "GET").toUpperCase();
    if (url.endsWith("/api/customers") && method === "GET") {
      return new Response(
        JSON.stringify({
          customers: [
            {
              id: "c1",
              name: "张三",
              gender: "male",
              tags: [],
              notes: "",
              customFields: {},
              createdAt: Date.now(),
            },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }
    return new Response(JSON.stringify({ code: "NOT_FOUND", message: "not found" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  };

  const { useAuthStore } = await import("../useAuthStore");
  const { useCustomerStore } = await import("../useCustomerStore");

  useAuthStore.setState({ accessToken: "token", status: "authenticated", hasHydrated: true, user: { id: "u1", email: "u@example.com" } });
  await useCustomerStore.getState().bootstrap();

  expect(useCustomerStore.getState().hasLoaded).toBe(true);
  expect(useCustomerStore.getState().customers.length).toBe(1);
  expect(useCustomerStore.getState().customers[0]?.id).toBe("c1");
});

test("addCustomer appends to list", async () => {
  process.env.NEXT_PUBLIC_API_BASE_URL = "http://example.test";

  let receivedBody: unknown = null;
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    const method = (init?.method ?? "GET").toUpperCase();
    if (url.endsWith("/api/customers") && method === "POST") {
      receivedBody = init?.body ? JSON.parse(String(init.body)) : null;
      return new Response(
        JSON.stringify({
          customer: {
            id: "c2",
            name: "李四",
            gender: "female",
            tags: [],
            notes: "",
            customFields: {},
            createdAt: Date.now(),
          },
        }),
        { status: 201, headers: { "content-type": "application/json" } },
      );
    }
    return new Response(JSON.stringify({ code: "NOT_FOUND", message: "not found" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  };

  const { useAuthStore } = await import("../useAuthStore");
  const { useCustomerStore } = await import("../useCustomerStore");

  useAuthStore.setState({ accessToken: "token", status: "authenticated", hasHydrated: true, user: { id: "u1", email: "u@example.com" } });
  const id = await useCustomerStore.getState().addCustomer({
    name: "李四",
  });

  expect(id).toBe("c2");
  expect(useCustomerStore.getState().customers.some((c) => c.id === "c2")).toBe(true);
  expect(receivedBody).toEqual({ name: "李四" });
});

test("loadCustomerEvents replaces events for customer", async () => {
  process.env.NEXT_PUBLIC_API_BASE_URL = "http://example.test";

  globalThis.fetch = async (input, init) => {
    const url = String(input);
    const method = (init?.method ?? "GET").toUpperCase();
    if (url.endsWith("/api/customers/c1/events") && method === "GET") {
      return new Response(
        JSON.stringify({
          events: [
            {
              id: "e1",
              customerId: "c1",
              time: "2026年1月1日",
              timestamp: 1767225600000,
              description: "升职",
              tags: [],
            },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }
    return new Response(JSON.stringify({ code: "NOT_FOUND", message: "not found" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  };

  const { useAuthStore } = await import("../useAuthStore");
  const { useCustomerStore } = await import("../useCustomerStore");

  useAuthStore.setState({ accessToken: "token", status: "authenticated", hasHydrated: true, user: { id: "u1", email: "u@example.com" } });
  useCustomerStore.setState({ events: [{ id: "old", customerId: "c1", time: "old", timestamp: 0, description: "old", tags: [] }] });

  await useCustomerStore.getState().loadCustomerEvents("c1");
  expect(useCustomerStore.getState().events.some((e) => e.id === "e1")).toBe(true);
  expect(useCustomerStore.getState().events.some((e) => e.id === "old")).toBe(false);
});
