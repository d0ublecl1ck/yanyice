import path from "node:path";
import { fileURLToPath } from "node:url";

export function getEnv(name: string): string | undefined {
  const value = process.env[name];
  if (!value) return undefined;
  return value;
}

export function getRequiredEnv(name: string): string {
  const value = getEnv(name);
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export function getPort(): number {
  const raw = getEnv("PORT") ?? "3311";
  const port = Number(raw);
  if (!Number.isFinite(port) || port <= 0) throw new Error(`Invalid PORT: ${raw}`);
  return port;
}

export function getDatabaseUrl(): string {
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = path.resolve(moduleDir, "../..");
  // TODO(d0ublecl1ck): Make this default location configurable (env/config) for non-local environments.
  const defaultDbPath = path.resolve("/Users/d0ublecl1ck/d0ublecl1ck_pkm/备份", "baghdad-v1.db");
  return normalizeDatabaseUrl(getEnv("DATABASE_URL") ?? `file:${defaultDbPath}`, repoRoot);
}

export function getJwtSecret(): string {
  return getEnv("JWT_SECRET") ?? "dev-only-change-me";
}

export function getCorsOrigin(): string | string[] | true {
  const raw = getEnv("CORS_ORIGIN");
  if (!raw) return true;

  const normalized = raw.trim();
  if (!normalized) return true;
  if (normalized === "*" || normalized.toLowerCase() === "true") return true;

  const origins = normalized
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (origins.length <= 1) return origins[0] ?? true;
  return origins;
}

export function normalizeDatabaseUrl(databaseUrl: string, repoRoot: string): string {
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
