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

describe("rule module", () => {
  const testDbDir = path.resolve(import.meta.dir, "../../.context/test-dbs");
  const testDbPath = path.join(testDbDir, `rules-${Date.now()}.db`);
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
    const res = await app.inject({ method: "GET", url: "/api/rules" });
    expect(res.statusCode).toBe(401);
  });

  it("supports CRUD", async () => {
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
      url: "/api/rules",
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(listRes.statusCode).toBe(200);
    const listBody = listRes.json() as {
      rules: Array<{ id: string; name: string; module: string; condition: string; message: string }>;
    };
    expect(listBody.rules).toHaveLength(0);

    const createRes = await app.inject({
      method: "POST",
      url: "/api/rules",
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        module: "bazi",
        name: "岁运并临",
        enabled: true,
        condition: "流年与大运同柱",
        message: "岁运并临，宜慎行。",
      },
    });
    expect(createRes.statusCode).toBe(201);
    const created = createRes.json() as { rule: { id: string; enabled: boolean; name: string } };
    expect(created.rule.name).toBe("岁运并临");
    expect(created.rule.enabled).toBe(true);

    const updateRes = await app.inject({
      method: "PUT",
      url: `/api/rules/${created.rule.id}`,
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { enabled: false },
    });
    expect(updateRes.statusCode).toBe(200);
    const updated = updateRes.json() as { rule: { enabled: boolean } };
    expect(updated.rule.enabled).toBe(false);

    const deleteRes = await app.inject({
      method: "DELETE",
      url: `/api/rules/${created.rule.id}`,
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(deleteRes.statusCode).toBe(204);
  });

  it("does not expose rule seeding endpoint", async () => {
    const res = await app.inject({ method: "POST", url: "/api/rules/seed" });
    expect(res.statusCode).toBe(404);
  });

  it("exposes OpenAPI paths for rules", async () => {
    const res = await app.inject({ method: "GET", url: "/openapi.json" });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { paths?: Record<string, unknown> };
    expect(body.paths?.["/api/rules"]).toBeDefined();
    expect(body.paths?.["/api/rules/seed"]).toBeUndefined();
  });
});
