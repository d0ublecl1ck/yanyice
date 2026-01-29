import path from "node:path";

import { createClient } from "@libsql/client";

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
  const repoRoot = path.resolve(import.meta.dir, "../../..");
  const result = Bun.spawnSync(
    ["bunx", "prisma", "migrate", "deploy", "--config", "prisma.config.ts"],
    {
      cwd: repoRoot,
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

export async function ensureDatabaseSchema(databaseUrl: string): Promise<void> {
  if (process.env.AUTO_MIGRATE !== "1") return;

  const alreadyInitialized = await hasTable(databaseUrl, "User");
  if (alreadyInitialized) return;

  runPrismaMigrateDeploy(databaseUrl);

  const nowInitialized = await hasTable(databaseUrl, "User");
  if (!nowInitialized) {
    throw new Error("Database schema init failed: expected table 'User' after migrate deploy.");
  }
}

