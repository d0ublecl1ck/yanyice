import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import fs from "node:fs";
import path from "node:path";

import { buildApp } from "../src/app";

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

describe("ai config module", () => {
  const testDbDir = path.resolve(import.meta.dir, "../../.context/test-dbs");
  const testDbPath = path.join(testDbDir, `ai-config-${Date.now()}.db`);
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

  it("stores config and api key without leaking secrets", async () => {
    const email = `u${Date.now()}@example.com`;
    const password = "password123";

    const registerRes = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: { email, password },
    });
    expect(registerRes.statusCode).toBe(201);
    const { accessToken } = registerRes.json() as { accessToken: string };

    const getDefault = await app.inject({
      method: "GET",
      url: "/api/ai/config",
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(getDefault.statusCode).toBe(200);
    expect(getDefault.json()).toEqual({ vendor: "zhipu", model: "", hasApiKey: false });

    const update = await app.inject({
      method: "PUT",
      url: "/api/ai/config",
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { model: "glm-4v-flash", apiKey: "sk-test-123" },
    });
    expect(update.statusCode).toBe(200);
    expect(update.json()).toEqual({ vendor: "zhipu", model: "glm-4v-flash", hasApiKey: true });

    const getAfter = await app.inject({
      method: "GET",
      url: "/api/ai/config",
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(getAfter.statusCode).toBe(200);
    expect(getAfter.json()).toEqual({ vendor: "zhipu", model: "glm-4v-flash", hasApiKey: true });

    const clear = await app.inject({
      method: "PUT",
      url: "/api/ai/config",
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { apiKey: "" },
    });
    expect(clear.statusCode).toBe(200);
    expect(clear.json()).toEqual({ vendor: "zhipu", model: "glm-4v-flash", hasApiKey: false });
  });

  it("exposes OpenAPI paths for ai config", async () => {
    const res = await app.inject({ method: "GET", url: "/openapi.json" });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { paths?: Record<string, unknown> };
    expect(body.paths?.["/api/ai/config"]).toBeDefined();
  });
});

