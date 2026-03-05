import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

import { createClient } from "@libsql/client";

type LibsqlConnection = {
  url: string;
  authToken?: string;
};

function splitSqlStatements(input: string): string[] {
  const statements: string[] = [];
  let current = "";
  let inSingle = false;
  let inDouble = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i]!;
    const next = input[i + 1];

    if (!inSingle && !inDouble && ch === "-" && next === "-") {
      while (i < input.length && input[i] !== "\n") i++;
      current += "\n";
      continue;
    }

    if (!inSingle && !inDouble && ch === "/" && next === "*") {
      i += 2;
      while (i < input.length) {
        const a = input[i]!;
        const b = input[i + 1];
        if (a === "*" && b === "/") {
          i++;
          break;
        }
        i++;
      }
      current += " ";
      continue;
    }

    if (ch === "'" && !inDouble) {
      const prev = input[i - 1];
      if (prev !== "\\") inSingle = !inSingle;
      current += ch;
      continue;
    }

    if (ch === `"` && !inSingle) {
      const prev = input[i - 1];
      if (prev !== "\\") inDouble = !inDouble;
      current += ch;
      continue;
    }

    if (ch === ";" && !inSingle && !inDouble) {
      const trimmed = current.trim();
      if (trimmed) statements.push(trimmed);
      current = "";
      continue;
    }

    current += ch;
  }

  const tail = current.trim();
  if (tail) statements.push(tail);
  return statements;
}

async function ensurePrismaMigrationsTable(conn: LibsqlConnection): Promise<void> {
  const client = createClient({ url: conn.url, authToken: conn.authToken });
  try {
    await client.execute({
      sql: `CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
              "id"                    TEXT PRIMARY KEY NOT NULL,
              "checksum"              TEXT NOT NULL,
              "finished_at"           DATETIME,
              "migration_name"        TEXT NOT NULL,
              "logs"                  TEXT,
              "rolled_back_at"        DATETIME,
              "started_at"            DATETIME NOT NULL DEFAULT current_timestamp,
              "applied_steps_count"   INTEGER UNSIGNED NOT NULL DEFAULT 0
            )`,
    });
  } finally {
    client.close();
  }
}

async function getAppliedMigrationChecksums(conn: LibsqlConnection): Promise<Map<string, string>> {
  const client = createClient({ url: conn.url, authToken: conn.authToken });
  try {
    const res = await client.execute({
      sql: `SELECT migration_name, checksum
            FROM "_prisma_migrations"
            WHERE rolled_back_at IS NULL AND finished_at IS NOT NULL`,
    });

    const map = new Map<string, string>();
    for (const row of res.rows as Array<{ migration_name?: unknown; checksum?: unknown }>) {
      const name = String(row.migration_name ?? "");
      const checksum = String(row.checksum ?? "");
      if (name) map.set(name, checksum);
    }
    return map;
  } finally {
    client.close();
  }
}

export async function applyLibsqlMigrations(options: {
  connection: LibsqlConnection;
  migrationsDir: string;
}): Promise<void> {
  await ensurePrismaMigrationsTable(options.connection);

  const applied = await getAppliedMigrationChecksums(options.connection);
  const entries = fs
    .readdirSync(options.migrationsDir, { withFileTypes: true })
    .filter((ent) => ent.isDirectory())
    .map((ent) => ent.name)
    .sort((a, b) => a.localeCompare(b));

  const client = createClient({ url: options.connection.url, authToken: options.connection.authToken });
  try {
    for (const migrationName of entries) {
      const migrationPath = path.join(options.migrationsDir, migrationName, "migration.sql");
      if (!fs.existsSync(migrationPath)) continue;

      const sql = fs.readFileSync(migrationPath, "utf8");
      const checksum = crypto.createHash("sha256").update(sql).digest("hex");

      const existingChecksum = applied.get(migrationName);
      if (existingChecksum) {
        if (existingChecksum !== checksum) {
          throw new Error(
            `Migration checksum mismatch for ${migrationName}: expected ${existingChecksum}, got ${checksum}`,
          );
        }
        continue;
      }

      const id = crypto.randomUUID();
      await client.execute({
        sql: `INSERT INTO "_prisma_migrations" ("id","checksum","migration_name","applied_steps_count")
              VALUES (?,?,?,0)`,
        args: [id, checksum, migrationName],
      });

      try {
        const statements = splitSqlStatements(sql);
        for (const stmt of statements) {
          await client.execute({ sql: stmt });
        }

        await client.execute({
          sql: `UPDATE "_prisma_migrations"
                SET finished_at = ?, applied_steps_count = 1
                WHERE id = ?`,
          args: [Date.now(), id],
        });
      } catch (err) {
        const message = err instanceof Error ? err.stack ?? err.message : String(err);
        await client.execute({
          sql: `UPDATE "_prisma_migrations"
                SET logs = ?, rolled_back_at = ?
                WHERE id = ?`,
          args: [message, Date.now(), id],
        });
        throw err;
      }
    }
  } finally {
    client.close();
  }
}

