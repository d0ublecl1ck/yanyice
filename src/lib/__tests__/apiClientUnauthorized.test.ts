import { afterEach, describe, expect, test } from "bun:test";

import { apiFetch, ApiError } from "../apiClient";

const originalFetch = globalThis.fetch;
const originalDispatchEvent = globalThis.dispatchEvent;

afterEach(() => {
  globalThis.fetch = originalFetch;
  globalThis.dispatchEvent = originalDispatchEvent;
});

describe("apiFetch unauthorized handling", () => {
  test("dispatches unauthorized event when accessToken request receives 401", async () => {
    let dispatched = 0;
    globalThis.dispatchEvent = () => {
      dispatched += 1;
      return true;
    };

    globalThis.fetch = async () =>
      new Response(JSON.stringify({ code: "UNAUTHORIZED", message: "登录已失效" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });

    await expect(apiFetch("/api/customers", { method: "GET", accessToken: "token" })).rejects.toBeInstanceOf(ApiError);
    expect(dispatched).toBe(1);
  });

  test("does not dispatch unauthorized event when accessToken is not provided", async () => {
    let dispatched = 0;
    globalThis.dispatchEvent = () => {
      dispatched += 1;
      return true;
    };

    globalThis.fetch = async () =>
      new Response(JSON.stringify({ code: "INVALID_CREDENTIALS", message: "账号或密码错误" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });

    await expect(apiFetch("/api/auth/login", { method: "POST", body: JSON.stringify({}) })).rejects.toBeInstanceOf(
      ApiError,
    );
    expect(dispatched).toBe(0);
  });
});

