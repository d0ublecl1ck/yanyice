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
  const raw = getEnv("PORT") ?? "3001";
  const port = Number(raw);
  if (!Number.isFinite(port) || port <= 0) throw new Error(`Invalid PORT: ${raw}`);
  return port;
}

export function getDatabaseUrl(): string {
  return getEnv("DATABASE_URL") ?? "file:./server/prisma/dev.db";
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
