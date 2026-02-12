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

async function registerAndGetToken(app: ReturnType<typeof buildApp>) {
  const email = `u${Date.now()}@example.com`;
  const password = "password123";
  const res = await app.inject({
    method: "POST",
    url: "/api/auth/register",
    payload: { email, password },
  });
  expect(res.statusCode).toBe(201);
  const body = res.json() as { accessToken: string };
  expect(typeof body.accessToken).toBe("string");
  return body.accessToken;
}

describe("records pinning", () => {
  const testDbDir = path.resolve(import.meta.dir, "../../.context/test-dbs");
  const testDbPath = path.join(testDbDir, `records-pin-${Date.now()}.db`);
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

  it("supports pinnedAt and lists pinned records first", async () => {
    const token = await registerAndGetToken(app);

    const createA = await app.inject({
      method: "POST",
      url: "/api/records",
      headers: { authorization: `Bearer ${token}` },
      payload: { module: "liuyao", subject: "A", notes: "", tags: [], liuyaoData: { lines: [0, 0, 0, 0, 0, 0], date: "", subject: "A", monthBranch: "", dayBranch: "" } },
    });
    expect(createA.statusCode).toBe(201);
    const recordA = (createA.json() as { record: { id: string } }).record;

    const createB = await app.inject({
      method: "POST",
      url: "/api/records",
      headers: { authorization: `Bearer ${token}` },
      payload: { module: "liuyao", subject: "B", notes: "", tags: [], liuyaoData: { lines: [0, 0, 0, 0, 0, 0], date: "", subject: "B", monthBranch: "", dayBranch: "" } },
    });
    expect(createB.statusCode).toBe(201);
    const recordB = (createB.json() as { record: { id: string } }).record;

    const pinB = await app.inject({
      method: "PUT",
      url: `/api/records/${recordB.id}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { pinnedAt: Date.now() },
    });
    expect(pinB.statusCode).toBe(200);
    const pinned = (pinB.json() as { record: { pinnedAt: number | null } }).record;
    expect(typeof pinned.pinnedAt).toBe("number");

    const list = await app.inject({
      method: "GET",
      url: "/api/records?module=liuyao",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(list.statusCode).toBe(200);
    const records = (list.json() as { records: Array<{ id: string; pinnedAt: number | null }> }).records;
    expect(records[0]?.id).toBe(recordB.id);
    expect(records.find((r) => r.id === recordA.id)).toBeTruthy();
  });
});

