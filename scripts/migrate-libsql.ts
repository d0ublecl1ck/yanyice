import "dotenv/config";

import path from "node:path";
import { fileURLToPath } from "node:url";

import { createClient } from "@libsql/client";

import { applyLibsqlMigrations } from "../server/src/db/libsqlMigrations";

type ConnectionConfig = {
  url: string;
  authToken?: string;
};

export type MigrateDatabasesOptions = {
  source: ConnectionConfig;
  destination: ConnectionConfig;
  wipeDestination: boolean;
  batchSize?: number;
  log?: (line: string) => void;
};

const BUSINESS_TABLES_IN_DELETE_ORDER = [
  "CustomerEvent",
  "ConsultationRecord",
  "Rule",
  "Quote",
  "UserAiCredential",
  "UserAiConfig",
  "Customer",
  "User",
] as const;

function getEnvTrimmed(name: string): string | undefined {
  const raw = process.env[name];
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  return trimmed;
}

function runPrismaMigrateDeploy(destination: ConnectionConfig) {
  if (destination.url.startsWith("libsql://")) {
    const moduleDir = path.dirname(fileURLToPath(import.meta.url));
    const repoRoot = path.resolve(moduleDir, "..");
    const migrationsDir = path.resolve(repoRoot, "server/prisma/migrations");
    return applyLibsqlMigrations({ connection: destination, migrationsDir });
  }

  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = path.resolve(moduleDir, "..");

  const env: Record<string, string> = { ...process.env, DATABASE_URL: destination.url, TURSO_DATABASE_URL: destination.url };
  if (destination.authToken) {
    env.TURSO_AUTH_TOKEN = destination.authToken;
    env.LIBSQL_AUTH_TOKEN = destination.authToken;
  }

  const result = Bun.spawnSync(["bunx", "prisma", "migrate", "deploy", "--config", "prisma.config.ts"], {
    cwd: repoRoot,
    env,
    stdout: "pipe",
    stderr: "pipe",
  });

  if (result.exitCode !== 0) {
    const stderr = new TextDecoder().decode(result.stderr);
    const stdout = new TextDecoder().decode(result.stdout);
    throw new Error(`prisma migrate deploy failed\nstdout:\n${stdout}\nstderr:\n${stderr}`);
  }
}

async function getTableColumns(client: ReturnType<typeof createClient>, tableName: string): Promise<string[]> {
  const res = await client.execute({ sql: `PRAGMA table_info("${tableName}")` });
  return res.rows.map((row) => String((row as { name: unknown }).name));
}

async function countRows(client: ReturnType<typeof createClient>, tableName: string): Promise<number> {
  const res = await client.execute({ sql: `SELECT COUNT(*) AS cnt FROM "${tableName}"` });
  return Number((res.rows[0] as { cnt?: unknown } | undefined)?.cnt ?? 0);
}

function toInsertSql(tableName: string, columns: string[]): string {
  const cols = columns.map((c) => `"${c}"`).join(",");
  const placeholders = columns.map(() => "?").join(",");
  return `INSERT INTO "${tableName}" (${cols}) VALUES (${placeholders})`;
}

export async function migrateDatabases(options: MigrateDatabasesOptions): Promise<void> {
  const log = options.log ?? (() => undefined);
  const batchSize = options.batchSize ?? 200;

  const sourceClient = createClient({ url: options.source.url, authToken: options.source.authToken });
  const destClient = createClient({ url: options.destination.url, authToken: options.destination.authToken });

  try {
    await runPrismaMigrateDeploy(options.destination);

    if (options.wipeDestination) {
      await destClient.execute({ sql: `PRAGMA foreign_keys=OFF` });
      for (const table of BUSINESS_TABLES_IN_DELETE_ORDER) {
        await destClient.execute({ sql: `DELETE FROM "${table}"` });
      }
      await destClient.execute({ sql: `PRAGMA foreign_keys=ON` });
    }

    for (const table of [...BUSINESS_TABLES_IN_DELETE_ORDER].reverse()) {
      const columns = await getTableColumns(sourceClient, table);
      if (columns.length === 0) continue;

      const selectSql = `SELECT ${columns.map((c) => `"${c}"`).join(",")} FROM "${table}"`;
      const rows = (await sourceClient.execute({ sql: selectSql })).rows as Record<string, unknown>[];
      if (rows.length === 0) continue;

      log(`${table}: copying ${rows.length} rows`);

      const insertSql = toInsertSql(table, columns);
      for (let i = 0; i < rows.length; i += batchSize) {
        const chunk = rows.slice(i, i + batchSize);
        const stmts = chunk.map((row) => ({
          sql: insertSql,
          args: columns.map((c) => (row as Record<string, unknown>)[c]),
        }));
        await destClient.batch(stmts);
      }
    }

    for (const table of BUSINESS_TABLES_IN_DELETE_ORDER) {
      const src = await countRows(sourceClient, table);
      const dst = await countRows(destClient, table);
      if (src !== dst) {
        throw new Error(`Row count mismatch for ${table}: source=${src} dest=${dst}`);
      }
    }

    const fk = await destClient.execute({ sql: `PRAGMA foreign_key_check` });
    if (fk.rows.length !== 0) {
      throw new Error(`Foreign key check failed: ${JSON.stringify(fk.rows[0])}`);
    }
  } finally {
    sourceClient.close();
    destClient.close();
  }
}

if (import.meta.main) {
  const argv = Bun.argv.slice(2);
  const wipeDestination =
    argv.includes("--wipe-destination") || argv.includes("--wipe-destination=1") || argv.includes("--wipe-destination=true");

  const defaultDbPath = path.resolve("/Users/d0ublecl1ck/d0ublecl1ck_pkm/备份", "baghdad-v1.db");
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = path.resolve(moduleDir, "..");

  const rawSourceUrl = getEnvTrimmed("SOURCE_DATABASE_URL") ?? `file:${defaultDbPath}`;
  const sourceUrl = (() => {
    if (!rawSourceUrl.startsWith("file:")) return rawSourceUrl;
    const fileUrl = rawSourceUrl.slice("file:".length);
    if (fileUrl.startsWith("//")) return rawSourceUrl;

    const [filePath, query] = fileUrl.split("?", 2);
    if (!filePath) return rawSourceUrl;

    const isWindowsAbs = /^[A-Za-z]:[\\/]/.test(filePath);
    const isPosixAbs = path.isAbsolute(filePath);
    if (isWindowsAbs || isPosixAbs) return rawSourceUrl;

    const absolutePath = path.resolve(repoRoot, filePath);
    return `file:${absolutePath}${query ? `?${query}` : ""}`;
  })();

  const destinationUrl = getEnvTrimmed("TURSO_DATABASE_URL") ?? getEnvTrimmed("DATABASE_URL");
  if (!destinationUrl) {
    throw new Error("Missing destination url: set TURSO_DATABASE_URL (recommended) or DATABASE_URL.");
  }

  const authToken = getEnvTrimmed("TURSO_AUTH_TOKEN") ?? getEnvTrimmed("LIBSQL_AUTH_TOKEN");

  await migrateDatabases({
    source: { url: sourceUrl },
    destination: { url: destinationUrl, authToken },
    wipeDestination,
    log: (line) => console.log(line),
  });
}
