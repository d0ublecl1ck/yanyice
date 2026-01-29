import { describe, it, expect, beforeEach, afterEach } from "bun:test";

const originalEnv = process.env.NEXT_PUBLIC_API_BASE_URL;

beforeEach(() => {
  delete process.env.NEXT_PUBLIC_API_BASE_URL;
});

afterEach(() => {
  if (originalEnv === undefined) delete process.env.NEXT_PUBLIC_API_BASE_URL;
  else process.env.NEXT_PUBLIC_API_BASE_URL = originalEnv;
});

describe("getApiBaseUrl", () => {
  it("defaults to same-origin when env is unset", async () => {
    const { getApiBaseUrl } = await import("../config");
    expect(getApiBaseUrl()).toBe("");
  });

  it("uses NEXT_PUBLIC_API_BASE_URL when provided", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://example.test:3001";
    const { getApiBaseUrl } = await import("../config");
    expect(getApiBaseUrl()).toBe("http://example.test:3001");
  });
});

