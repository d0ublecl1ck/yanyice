import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.dirname(fileURLToPath(import.meta.url));

function normalizeDatabaseUrl(databaseUrl: string): string {
  if (!databaseUrl.startsWith("file:")) return databaseUrl;

  const fileUrl = databaseUrl.slice("file:".length);
  if (fileUrl.startsWith("//")) return databaseUrl;

  const [filePath, query] = fileUrl.split("?", 2);
  if (!filePath) return databaseUrl;

  const isWindowsAbs = /^[A-Za-z]:[\\/]/.test(filePath);
  const isPosixAbs = path.isAbsolute(filePath);
  if (isWindowsAbs || isPosixAbs) return databaseUrl;

  const absolutePath = path.resolve(repoRoot, filePath);
  return `file:${absolutePath}${query ? `?${query}` : ""}`;
}

const prismaConfig = {
  schema: "server/prisma/schema.prisma",
  datasource: {
    url: normalizeDatabaseUrl(
      process.env.DATABASE_URL ?? `file:${path.resolve("/Users/d0ublecl1ck/d0ublecl1ck_pkm/备份", "baghdad-v1.db")}`,
    ),
  },
};

export default prismaConfig;
