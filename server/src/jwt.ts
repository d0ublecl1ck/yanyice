import crypto from "node:crypto";

import { getJwtSecret } from "./config";

function base64UrlEncode(input: Buffer | string): string {
  const raw = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return raw.toString("base64url");
}

function base64UrlDecode(input: string): Buffer {
  return Buffer.from(input, "base64url");
}

function safeJsonParse(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

export type JwtPayload = {
  sub: string;
  iat?: number;
  exp?: number;
};

export function signAccessToken(payload: JwtPayload, options?: { secret?: string }): string {
  const secret = options?.secret ?? getJwtSecret();
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const body = base64UrlEncode(JSON.stringify({ iat: now, ...payload }));
  const unsigned = `${header}.${body}`;
  const signature = crypto.createHmac("sha256", secret).update(unsigned).digest("base64url");
  return `${unsigned}.${signature}`;
}

export function verifyAccessToken(token: string, options?: { secret?: string }): JwtPayload | null {
  const secret = options?.secret ?? getJwtSecret();
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [header, body, signature] = parts;
  if (!header || !body || !signature) return null;

  const unsigned = `${header}.${body}`;
  const expected = crypto.createHmac("sha256", secret).update(unsigned).digest();
  const provided = Buffer.from(signature, "base64url");
  if (provided.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(provided, expected)) return null;

  const headerJson = safeJsonParse(base64UrlDecode(header).toString("utf8"));
  if (
    !headerJson ||
    typeof headerJson !== "object" ||
    !("alg" in headerJson) ||
    (headerJson as { alg?: unknown }).alg !== "HS256"
  ) {
    return null;
  }

  const payloadJson = safeJsonParse(base64UrlDecode(body).toString("utf8"));
  if (!payloadJson || typeof payloadJson !== "object") return null;

  const sub = (payloadJson as { sub?: unknown }).sub;
  if (typeof sub !== "string" || !sub) return null;

  const exp = (payloadJson as { exp?: unknown }).exp;
  if (typeof exp === "number" && Number.isFinite(exp)) {
    const now = Math.floor(Date.now() / 1000);
    if (exp <= now) return null;
  }

  const iat = (payloadJson as { iat?: unknown }).iat;
  return {
    sub,
    iat: typeof iat === "number" && Number.isFinite(iat) ? iat : undefined,
    exp: typeof exp === "number" && Number.isFinite(exp) ? exp : undefined,
  };
}

