import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import fs from "node:fs";
import path from "node:path";

import { createClient } from "@libsql/client";

import { ensureDatabaseSchema } from "../src/db/ensureDatabaseSchema";

describe("ensureDatabaseSchema", () => {
  const originalAutoMigrate = process.env.AUTO_MIGRATE;
  const testDbDir = path.resolve(import.meta.dir, "../../.context/test-dbs");
  const testDbPath = path.join(testDbDir, `ensure-schema-${Date.now()}.db`);
  const databaseUrl = `file:${testDbPath}`;

  beforeAll(() => {
    fs.mkdirSync(testDbDir, { recursive: true });
    process.env.AUTO_MIGRATE = "1";
  });

  afterAll(() => {
    if (originalAutoMigrate === undefined) {
      delete process.env.AUTO_MIGRATE;
    } else {
      process.env.AUTO_MIGRATE = originalAutoMigrate;
    }

    try {
      fs.rmSync(testDbPath);
    } catch {
      // ignore
    }
  });

  it("creates tables when missing and does not reset existing data", async () => {
    await ensureDatabaseSchema(databaseUrl);

    const client = createClient({ url: databaseUrl });
    try {
      const userId = crypto.randomUUID();
      await client.execute({
        sql: `INSERT INTO "User" ("id", "email", "passwordHash", "createdAt", "updatedAt")
              VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        args: [userId, `u${Date.now()}@example.com`, "hash"],
      });

      await ensureDatabaseSchema(databaseUrl);

      const res = await client.execute({ sql: `SELECT COUNT(*) as cnt FROM "User"` });
      const cnt = Number(res.rows[0]?.cnt ?? 0);
      expect(cnt).toBe(1);
    } finally {
      client.close();
    }
  });
});

