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

describe("customer module", () => {
  const testDbDir = path.resolve(import.meta.dir, "../../.context/test-dbs");
  const testDbPath = path.join(testDbDir, `customers-${Date.now()}.db`);
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
    const res = await app.inject({ method: "GET", url: "/api/customers" });
    expect(res.statusCode).toBe(401);
  });

  it("supports customer CRUD and events", async () => {
    const email = `u${Date.now()}@example.com`;
    const password = "password123";

    const registerRes = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: { email, password },
    });
    expect(registerRes.statusCode).toBe(201);
    const { accessToken } = registerRes.json() as { accessToken: string };

    const createRes = await app.inject({
      method: "POST",
      url: "/api/customers",
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { name: "张三", gender: "male", tags: ["重要客户"], notes: "备注" },
    });
    expect(createRes.statusCode).toBe(201);
    const created = createRes.json() as { customer: { id: string; name: string } };
    expect(created.customer.name).toBe("张三");

    const listRes = await app.inject({
      method: "GET",
      url: "/api/customers",
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(listRes.statusCode).toBe(200);
    const listBody = listRes.json() as { customers: Array<{ id: string }> };
    expect(listBody.customers.some((c) => c.id === created.customer.id)).toBe(true);

    const getRes = await app.inject({
      method: "GET",
      url: `/api/customers/${created.customer.id}`,
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(getRes.statusCode).toBe(200);

    const updateRes = await app.inject({
      method: "PUT",
      url: `/api/customers/${created.customer.id}`,
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { name: "李四" },
    });
    expect(updateRes.statusCode).toBe(200);
    const updated = updateRes.json() as { customer: { name: string } };
    expect(updated.customer.name).toBe("李四");

    const createEventRes = await app.inject({
      method: "POST",
      url: `/api/customers/${created.customer.id}/events`,
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { occurredAt: "2026-01-01", description: "升职", tags: ["事业"] },
    });
    expect(createEventRes.statusCode).toBe(201);
    const createdEvent = createEventRes.json() as { event: { id: string } };

    const listEventsRes = await app.inject({
      method: "GET",
      url: `/api/customers/${created.customer.id}/events`,
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(listEventsRes.statusCode).toBe(200);
    const eventsBody = listEventsRes.json() as { events: Array<{ id: string }> };
    expect(eventsBody.events.some((e) => e.id === createdEvent.event.id)).toBe(true);

    const deleteEventRes = await app.inject({
      method: "DELETE",
      url: `/api/customers/${created.customer.id}/events/${createdEvent.event.id}`,
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(deleteEventRes.statusCode).toBe(204);

    const deleteRes = await app.inject({
      method: "DELETE",
      url: `/api/customers/${created.customer.id}`,
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(deleteRes.statusCode).toBe(204);

    const getAfterDelete = await app.inject({
      method: "GET",
      url: `/api/customers/${created.customer.id}`,
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(getAfterDelete.statusCode).toBe(404);
  });

  it("exposes OpenAPI paths for customers", async () => {
    const res = await app.inject({ method: "GET", url: "/openapi.json" });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { paths?: Record<string, unknown> };
    expect(body.paths?.["/api/customers"]).toBeDefined();
  });
});

