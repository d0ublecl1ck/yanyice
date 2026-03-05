import { afterEach, describe, expect, it } from "bun:test";

import { getDatabaseConfig } from "../src/config";

function snapshotEnv(keys: string[]) {
  const snap: Record<string, string | undefined> = {};
  for (const key of keys) snap[key] = process.env[key];
  return snap;
}

function restoreEnv(snap: Record<string, string | undefined>) {
  for (const [key, value] of Object.entries(snap)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

describe("getDatabaseConfig", () => {
  const keys = ["TURSO_DATABASE_URL", "TURSO_AUTH_TOKEN", "LIBSQL_AUTH_TOKEN", "DATABASE_URL"];
  const snap = snapshotEnv(keys);

  afterEach(() => {
    restoreEnv(snap);
  });

  it("throws when no Turso/libsql url is provided", () => {
    delete process.env.TURSO_DATABASE_URL;
    delete process.env.DATABASE_URL;
    expect(() => getDatabaseConfig()).toThrow();
  });

  it("accepts TURSO_DATABASE_URL and returns token when present", () => {
    process.env.TURSO_DATABASE_URL = "libsql://example.turso.io";
    process.env.TURSO_AUTH_TOKEN = "token";
    const cfg = getDatabaseConfig();
    expect(cfg.url).toBe("libsql://example.turso.io");
    expect(cfg.authToken).toBe("token");
  });

  it("accepts DATABASE_URL when it is libsql://", () => {
    process.env.DATABASE_URL = "libsql://example-from-database-url.turso.io";
    delete process.env.TURSO_DATABASE_URL;
    const cfg = getDatabaseConfig();
    expect(cfg.url).toBe("libsql://example-from-database-url.turso.io");
  });

  it("rejects file: DATABASE_URL (runtime is Turso-only)", () => {
    process.env.DATABASE_URL = "file:./dev.db";
    delete process.env.TURSO_DATABASE_URL;
    expect(() => getDatabaseConfig()).toThrow();
  });
});

