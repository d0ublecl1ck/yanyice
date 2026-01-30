import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { createClient } from "@libsql/client";

import { ensureSqliteDirectory } from "./ensureSqliteDirectory";

async function hasTable(databaseUrl: string, tableName: string): Promise<boolean> {
  const client = createClient({ url: databaseUrl });
  try {
    const result = await client.execute({
      sql: "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1",
      args: [tableName],
    });
    return (result.rows?.length ?? 0) > 0;
  } finally {
    client.close();
  }
}

function runPrismaMigrateDeploy(databaseUrl: string) {
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = path.resolve(moduleDir, "../../..");
  const result = spawnSync("bunx", ["prisma", "migrate", "deploy", "--config", "prisma.config.ts"], {
    cwd: repoRoot,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    encoding: "utf8",
  });

  if (result.status !== 0) {
    throw new Error(`prisma migrate deploy failed\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
  }
}

export async function ensureDatabaseSchema(databaseUrl: string): Promise<void> {
  if (process.env.AUTO_MIGRATE !== "1") return;

  ensureSqliteDirectory(databaseUrl);

  const alreadyInitialized = await hasTable(databaseUrl, "User");
  if (alreadyInitialized) return;

  runPrismaMigrateDeploy(databaseUrl);

  const nowInitialized = await hasTable(databaseUrl, "User");
  if (!nowInitialized) {
    throw new Error("Database schema init failed: expected table 'User' after migrate deploy.");
  }
}
