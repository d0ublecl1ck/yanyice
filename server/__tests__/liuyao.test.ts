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

describe("liuyao module", () => {
  const testDbDir = path.resolve(import.meta.dir, "../../.context/test-dbs");
  const testDbPath = path.join(testDbDir, `liuyao-${Date.now()}.db`);
  const databaseUrl = `file:${testDbPath}`;

  let app: ReturnType<typeof buildApp>;
  let accessToken = "";

  beforeAll(async () => {
    fs.mkdirSync(testDbDir, { recursive: true });
    runPrismaMigrateDeploy(databaseUrl);
    app = buildApp({ databaseUrl, logger: false });
    await app.ready();

    const email = `u${Date.now()}@example.com`;
    const password = "password123";
    const registerRes = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: { email, password },
    });
    expect(registerRes.statusCode).toBe(201);
    accessToken = (registerRes.json() as { accessToken: string }).accessToken;
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
    const res = await app.inject({ method: "GET", url: "/api/liuyao/records" });
    expect(res.statusCode).toBe(401);
  });

  it("supports CRUD for liuyao records", async () => {
    const createRes = await app.inject({
      method: "POST",
      url: "/api/liuyao/records",
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        customerId: "cust-001",
        customerName: "张三",
        subject: "占近期合作能否成",
        notes: "先观用神与世应，再看动变。",
        tags: ["合作"],
        liuyaoData: {
          lines: [0, 2, 1, 0, 1, 0],
          date: new Date("2026-01-01T00:00:00.000Z").toISOString(),
          subject: "合作项目",
          monthBranch: "子",
          dayBranch: "甲子",
        },
      },
    });
    expect(createRes.statusCode).toBe(201);
    const created = createRes.json() as { record: { id: string; subject: string; customerName?: string } };
    expect(created.record.subject).toBe("占近期合作能否成");
    expect(created.record.customerName).toBe("张三");

    const listRes = await app.inject({
      method: "GET",
      url: "/api/liuyao/records",
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(listRes.statusCode).toBe(200);
    const listBody = listRes.json() as { records: Array<{ id: string }> };
    expect(listBody.records.some((r) => r.id === created.record.id)).toBe(true);

    const getRes = await app.inject({
      method: "GET",
      url: `/api/liuyao/records/${encodeURIComponent(created.record.id)}`,
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(getRes.statusCode).toBe(200);

    const updateRes = await app.inject({
      method: "PUT",
      url: `/api/liuyao/records/${encodeURIComponent(created.record.id)}`,
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { subject: "占近期合作是否顺利" },
    });
    expect(updateRes.statusCode).toBe(200);
    const updated = updateRes.json() as { record: { id: string; subject: string } };
    expect(updated.record.subject).toBe("占近期合作是否顺利");

    const delRes = await app.inject({
      method: "DELETE",
      url: `/api/liuyao/records/${encodeURIComponent(created.record.id)}`,
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(delRes.statusCode).toBe(200);
    expect((delRes.json() as { ok: boolean }).ok).toBe(true);

    const getAfterDel = await app.inject({
      method: "GET",
      url: `/api/liuyao/records/${encodeURIComponent(created.record.id)}`,
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(getAfterDel.statusCode).toBe(404);
  });
});

