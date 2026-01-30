import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import fs from "node:fs";
import path from "node:path";

import { buildApp } from "../src/app";
import { DEFAULT_QUOTES } from "../src/quotes/defaultQuotes";

function runPrismaMigrateDeploy(databaseUrl: string) {
  const result = Bun.spawnSync(
    ["bunx", "prisma", "migrate", "deploy", "--config", "prisma.config.ts"],
    {
      cwd: path.resolve(import.meta.dir, "../.."),
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdout: "pipe",
      stderr: "pipe",
    },
  );

  if (result.exitCode !== 0) {
    const stderr = new TextDecoder().decode(result.stderr);
    const stdout = new TextDecoder().decode(result.stdout);
    throw new Error(`prisma migrate deploy failed\nstdout:\n${stdout}\nstderr:\n${stderr}`);
  }
}

describe("quote module", () => {
  const testDbDir = path.resolve(import.meta.dir, "../../.context/test-dbs");
  const testDbPath = path.join(testDbDir, `quotes-${Date.now()}.db`);
  const databaseUrl = `file:${testDbPath}`;

  let app: ReturnType<typeof buildApp>;

  beforeAll(async () => {
    fs.mkdirSync(testDbDir, { recursive: true });
    runPrismaMigrateDeploy(databaseUrl);
    app = buildApp({ databaseUrl, logger: false });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    try {
      fs.rmSync(testDbPath);
    } catch {
      // ignore
    }
  });

  it("requires authentication", async () => {
    const res = await app.inject({ method: "GET", url: "/api/quotes" });
    expect(res.statusCode).toBe(401);
  });

  it("seeds defaults and supports CRUD + reset", async () => {
    const email = `u${Date.now()}@example.com`;
    const password = "password123";

    const registerRes = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: { email, password },
    });
    expect(registerRes.statusCode).toBe(201);
    const { accessToken } = registerRes.json() as { accessToken: string };

    const listRes = await app.inject({
      method: "GET",
      url: "/api/quotes",
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(listRes.statusCode).toBe(200);
    const listBody = listRes.json() as {
      quotes: Array<{ id: string; text: string; enabled: boolean; isSystem: boolean }>;
    };
    expect(listBody.quotes.length).toBe(DEFAULT_QUOTES.length);
    expect(listBody.quotes.every((q) => q.isSystem)).toBe(true);

    const createRes = await app.inject({
      method: "POST",
      url: "/api/quotes",
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { text: "新的一条", enabled: true },
    });
    expect(createRes.statusCode).toBe(201);
    const created = createRes.json() as { quote: { id: string; isSystem: boolean; text: string } };
    expect(created.quote.isSystem).toBe(false);
    expect(created.quote.text).toBe("新的一条");

    const updateRes = await app.inject({
      method: "PUT",
      url: `/api/quotes/${created.quote.id}`,
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { enabled: false, text: "改后" },
    });
    expect(updateRes.statusCode).toBe(200);
    const updated = updateRes.json() as { quote: { enabled: boolean; text: string } };
    expect(updated.quote.enabled).toBe(false);
    expect(updated.quote.text).toBe("改后");

    const system = listBody.quotes[0]!;
    const systemUpdateRes = await app.inject({
      method: "PUT",
      url: `/api/quotes/${system.id}`,
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { enabled: false, text: "临时修改" },
    });
    expect(systemUpdateRes.statusCode).toBe(200);

    const resetRes = await app.inject({
      method: "POST",
      url: "/api/quotes/reset",
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(resetRes.statusCode).toBe(204);

    const afterResetList = await app.inject({
      method: "GET",
      url: "/api/quotes",
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(afterResetList.statusCode).toBe(200);
    const afterResetBody = afterResetList.json() as {
      quotes: Array<{ id: string; text: string; enabled: boolean; isSystem: boolean }>;
    };
    const restored = afterResetBody.quotes.find((q) => q.id === system.id);
    expect(restored).toBeDefined();
    expect(restored?.enabled).toBe(true);
    expect(DEFAULT_QUOTES.some((q) => q.text === restored?.text)).toBe(true);

    const deleteRes = await app.inject({
      method: "DELETE",
      url: `/api/quotes/${created.quote.id}`,
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(deleteRes.statusCode).toBe(204);
  });

  it("exposes OpenAPI paths for quotes", async () => {
    const res = await app.inject({ method: "GET", url: "/openapi.json" });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { paths?: Record<string, unknown> };
    expect(body.paths?.["/api/quotes"]).toBeDefined();
    expect(body.paths?.["/api/quotes/reset"]).toBeDefined();
  });
});

