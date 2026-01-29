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

describe("auth module", () => {
  const testDbDir = path.resolve(import.meta.dir, "../../.context/test-dbs");
  const testDbPath = path.join(testDbDir, `auth-${Date.now()}.db`);
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

  it("register -> me -> login", async () => {
    const email = `u${Date.now()}@example.com`;
    const password = "password123";

    const registerRes = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: { email, password },
    });
    expect(registerRes.statusCode).toBe(201);
    const registerBody = registerRes.json() as { user: { id: string; email: string }; accessToken: string };
    expect(registerBody.user.email).toBe(email);
    expect(typeof registerBody.accessToken).toBe("string");

    const meUnauthorized = await app.inject({ method: "GET", url: "/api/auth/me" });
    expect(meUnauthorized.statusCode).toBe(401);

    const meRes = await app.inject({
      method: "GET",
      url: "/api/auth/me",
      headers: { authorization: `Bearer ${registerBody.accessToken}` },
    });
    expect(meRes.statusCode).toBe(200);
    const meBody = meRes.json() as { user: { id: string; email: string } };
    expect(meBody.user.id).toBe(registerBody.user.id);

    const loginBad = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email, password: "wrong-password" },
    });
    expect(loginBad.statusCode).toBe(401);

    const loginRes = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email, password },
    });
    expect(loginRes.statusCode).toBe(200);
  });

  it("exposes OpenAPI json", async () => {
    const res = await app.inject({ method: "GET", url: "/openapi.json" });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { paths?: Record<string, unknown> };
    expect(body.paths?.["/api/auth/login"]).toBeDefined();
  });

  it("supports CORS preflight for auth endpoints", async () => {
    const origin = "http://localhost:3000";
    const res = await app.inject({
      method: "OPTIONS",
      url: "/api/auth/login",
      headers: {
        origin,
        "access-control-request-method": "POST",
        "access-control-request-headers": "content-type, authorization",
      },
    });

    expect([200, 204]).toContain(res.statusCode);
    expect(res.headers["access-control-allow-origin"]).toBe(origin);
    expect(res.headers["access-control-allow-methods"]).toContain("POST");
    expect(res.headers["access-control-allow-headers"]).toContain("authorization");
    expect(res.headers["access-control-allow-headers"]).toContain("content-type");
  });
});
