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

test("bootstrap loads ai config once authenticated", async () => {
  process.env.NEXT_PUBLIC_API_BASE_URL = "http://example.test";

  globalThis.fetch = async (input, init) => {
    const url = String(input);
    const method = (init?.method ?? "GET").toUpperCase();
    if (url.endsWith("/api/ai/config") && method === "GET") {
      return new Response(JSON.stringify({ vendor: "zhipu", model: "glm-4v-flash", hasApiKey: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ code: "NOT_FOUND", message: "not found" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  };

  const { useAuthStore } = await import("../useAuthStore");
  const { useAiConfigStore } = await import("../useAiConfigStore");

  useAuthStore.setState({
    accessToken: "token",
    status: "authenticated",
    hasHydrated: true,
    user: { id: "u1", email: "u@example.com" },
  });

  await useAiConfigStore.getState().bootstrap();
  expect(useAiConfigStore.getState().vendor).toBe("zhipu");
  expect(useAiConfigStore.getState().model).toBe("glm-4v-flash");
  expect(useAiConfigStore.getState().hasApiKey).toBe(true);
});

test("updateModel and saveApiKey send PUT requests", async () => {
  process.env.NEXT_PUBLIC_API_BASE_URL = "http://example.test";

  const receivedBodies: unknown[] = [];
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    const method = (init?.method ?? "GET").toUpperCase();
    if (url.endsWith("/api/ai/config") && method === "PUT") {
      const body = init?.body ? JSON.parse(String(init.body)) : null;
      receivedBodies.push(body);
      const vendor = typeof body?.vendor === "string" ? body.vendor : "zhipu";
      const model = typeof body?.model === "string" ? body.model : "glm-4v-flash";
      const hasApiKey = typeof body?.apiKey === "string" ? body.apiKey.trim().length > 0 : true;
      return new Response(JSON.stringify({ vendor, model, hasApiKey }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    if (url.endsWith("/api/ai/config") && method === "GET") {
      return new Response(JSON.stringify({ vendor: "zhipu", model: "", hasApiKey: false }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ code: "NOT_FOUND", message: "not found" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  };

  const { useAuthStore } = await import("../useAuthStore");
  const { useAiConfigStore } = await import("../useAiConfigStore");

  useAuthStore.setState({
    accessToken: "token",
    status: "authenticated",
    hasHydrated: true,
    user: { id: "u1", email: "u@example.com" },
  });

  await useAiConfigStore.getState().updateModel("  glm-4v-flash  ");
  await useAiConfigStore.getState().saveApiKey(" sk-test ");

  expect(receivedBodies).toEqual([{ model: "glm-4v-flash" }, { apiKey: "sk-test" }]);
  expect(useAiConfigStore.getState().model).toBe("glm-4v-flash");
  expect(useAiConfigStore.getState().hasApiKey).toBe(true);
});

test("updateVendor sends PUT request", async () => {
  process.env.NEXT_PUBLIC_API_BASE_URL = "http://example.test";

  const receivedBodies: unknown[] = [];
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    const method = (init?.method ?? "GET").toUpperCase();
    if (url.endsWith("/api/ai/config") && method === "PUT") {
      const body = init?.body ? JSON.parse(String(init.body)) : null;
      receivedBodies.push(body);
      const vendor = typeof body?.vendor === "string" ? body.vendor : "zhipu";
      return new Response(JSON.stringify({ vendor, model: "", hasApiKey: false }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    if (url.endsWith("/api/ai/config") && method === "GET") {
      return new Response(JSON.stringify({ vendor: "zhipu", model: "", hasApiKey: false }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ code: "NOT_FOUND", message: "not found" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  };

  const { useAuthStore } = await import("../useAuthStore");
  const { useAiConfigStore } = await import("../useAiConfigStore");

  useAuthStore.setState({
    accessToken: "token",
    status: "authenticated",
    hasHydrated: true,
    user: { id: "u1", email: "u@example.com" },
  });

  await useAiConfigStore.getState().updateVendor("openai");

  expect(receivedBodies).toEqual([{ vendor: "openai" }]);
  expect(useAiConfigStore.getState().vendor).toBe("openai");
});
