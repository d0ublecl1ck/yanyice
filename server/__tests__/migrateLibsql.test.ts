import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import fs from "node:fs";
import path from "node:path";

import { createClient } from "@libsql/client";

import { migrateDatabases } from "../../scripts/migrate-libsql";

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

describe("migrateDatabases", () => {
  const testDbDir = path.resolve(import.meta.dir, "../../.context/test-dbs");
  const sourceDbPath = path.join(testDbDir, `migrate-source-${Date.now()}.db`);
  const destDbPath = path.join(testDbDir, `migrate-dest-${Date.now()}.db`);
  const sourceUrl = `file:${sourceDbPath}`;
  const destUrl = `file:${destDbPath}`;

  beforeAll(() => {
    fs.mkdirSync(testDbDir, { recursive: true });
    runPrismaMigrateDeploy(sourceUrl);
    runPrismaMigrateDeploy(destUrl);
  });

  afterAll(() => {
    try {
      fs.rmSync(sourceDbPath);
    } catch {
      // ignore
    }
    try {
      fs.rmSync(destDbPath);
    } catch {
      // ignore
    }
  });

  it("wipes destination and copies rows preserving foreign keys", async () => {
    const source = createClient({ url: sourceUrl });
    const dest = createClient({ url: destUrl });
    try {
      const userId = crypto.randomUUID();
      const customerId = crypto.randomUUID();
      const recordId = crypto.randomUUID();

      await source.execute({
        sql: `INSERT INTO "User" ("id","email","passwordHash","createdAt","updatedAt")
              VALUES (?,?,?,?,?)`,
        args: [userId, `u${Date.now()}@example.com`, "hash", new Date().toISOString(), new Date().toISOString()],
      });

      await source.execute({
        sql: `INSERT INTO "Customer" ("id","userId","name","gender","birthDate","birthTime","phone","tags","notes","customFields","createdAt","updatedAt")
              VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        args: [
          customerId,
          userId,
          "张三",
          "男",
          null,
          null,
          null,
          "[]",
          "",
          "{}",
          new Date().toISOString(),
          new Date().toISOString(),
        ],
      });

      await source.execute({
        sql: `INSERT INTO "ConsultationRecord" ("id","userId","module","customerId","customerName","subject","notes","tagsJson","liuyaoDataJson","baziDataJson","verifiedStatus","verifiedNotes","pinnedAt","createdAt","updatedAt")
              VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        args: [
          recordId,
          userId,
          "liuyao",
          customerId,
          "张三",
          "测试",
          "记录",
          "[]",
          null,
          null,
          "unverified",
          "",
          null,
          new Date().toISOString(),
          new Date().toISOString(),
        ],
      });

      // Seed destination with a conflicting row to ensure wipe works.
      await dest.execute({
        sql: `INSERT INTO "User" ("id","email","passwordHash","createdAt","updatedAt")
              VALUES (?,?,?,?,?)`,
        args: [crypto.randomUUID(), `old${Date.now()}@example.com`, "hash", new Date().toISOString(), new Date().toISOString()],
      });

      await migrateDatabases({
        source: { url: sourceUrl },
        destination: { url: destUrl },
        wipeDestination: true,
      });

      const srcUserCnt = Number((await source.execute({ sql: `SELECT COUNT(*) AS cnt FROM "User"` })).rows[0]?.cnt ?? 0);
      const dstUserCnt = Number((await dest.execute({ sql: `SELECT COUNT(*) AS cnt FROM "User"` })).rows[0]?.cnt ?? 0);
      expect(dstUserCnt).toBe(srcUserCnt);

      const srcCustomerCnt = Number((await source.execute({ sql: `SELECT COUNT(*) AS cnt FROM "Customer"` })).rows[0]?.cnt ?? 0);
      const dstCustomerCnt = Number((await dest.execute({ sql: `SELECT COUNT(*) AS cnt FROM "Customer"` })).rows[0]?.cnt ?? 0);
      expect(dstCustomerCnt).toBe(srcCustomerCnt);

      const srcRecordCnt = Number(
        (await source.execute({ sql: `SELECT COUNT(*) AS cnt FROM "ConsultationRecord"` })).rows[0]?.cnt ?? 0,
      );
      const dstRecordCnt = Number(
        (await dest.execute({ sql: `SELECT COUNT(*) AS cnt FROM "ConsultationRecord"` })).rows[0]?.cnt ?? 0,
      );
      expect(dstRecordCnt).toBe(srcRecordCnt);

      const fk = await dest.execute({ sql: `PRAGMA foreign_key_check` });
      expect(fk.rows.length).toBe(0);
    } finally {
      source.close();
      dest.close();
    }
  });
});

