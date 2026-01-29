import { defineConfig } from "prisma/config";
import path from "node:path";

function normalizeDatabaseUrl(databaseUrl: string): string {
  if (!databaseUrl.startsWith("file:")) return databaseUrl;

  const fileUrl = databaseUrl.slice("file:".length);
  if (fileUrl.startsWith("//")) return databaseUrl;

  const [filePath, query] = fileUrl.split("?", 2);
  if (!filePath) return databaseUrl;

  const isWindowsAbs = /^[A-Za-z]:[\\/]/.test(filePath);
  const isPosixAbs = path.isAbsolute(filePath);
  if (isWindowsAbs || isPosixAbs) return databaseUrl;

  const repoRoot = import.meta.dir;
  const absolutePath = path.resolve(repoRoot, filePath);
  return `file:${absolutePath}${query ? `?${query}` : ""}`;
}

export default defineConfig({
  schema: "server/prisma/schema.prisma",
  datasource: {
    url: normalizeDatabaseUrl(
      process.env.DATABASE_URL ?? `file:${path.resolve(import.meta.dir, "server/prisma/dev.db")}`,
    ),
  },
});
