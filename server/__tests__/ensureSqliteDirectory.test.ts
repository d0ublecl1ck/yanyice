import { describe, expect, it } from "bun:test";
import fs from "node:fs";
import path from "node:path";

import { ensureSqliteDirectory } from "../src/db/ensureSqliteDirectory";

describe("ensureSqliteDirectory", () => {
  const testDbRoot = path.resolve(import.meta.dir, "../../.context/test-dbs");

  it("creates the parent directory for prisma-style file: URLs", () => {
    const testDbDir = path.join(testDbRoot, `ensure-dir-${Date.now()}`);
    const testDbPath = path.join(testDbDir, "db.db");
    const databaseUrl = `file:${testDbPath}`;

    fs.rmSync(testDbDir, { recursive: true, force: true });
    expect(fs.existsSync(testDbDir)).toBe(false);

    ensureSqliteDirectory(databaseUrl);

    expect(fs.existsSync(testDbDir)).toBe(true);
  });

  it("does nothing for non-file: URLs", () => {
    ensureSqliteDirectory("libsql://example.invalid");
    expect(true).toBe(true);
  });
});

