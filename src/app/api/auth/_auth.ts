import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { getPrismaClient } from "../../../../server/src/prismaSingleton";
import { signAccessToken, verifyAccessToken } from "../../../../server/src/jwt";

const prisma = getPrismaClient();

export type ErrorBody = { code: string; message: string };

export function jsonError(status: number, body: ErrorBody) {
  return NextResponse.json(body, { status });
}

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function parseAuthBody(req: Request): Promise<{ email: string; password: string } | null> {
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return null;
  const data = (await req.json().catch(() => null)) as unknown;
  if (!data || typeof data !== "object") return null;

  const email = (data as { email?: unknown }).email;
  const password = (data as { password?: unknown }).password;
  if (typeof email !== "string" || typeof password !== "string") return null;

  const normalizedEmail = email.trim().toLowerCase();
  if (!emailRe.test(normalizedEmail)) return null;
  if (password.length < 6 || password.length > 128) return null;
  return { email: normalizedEmail, password };
}

export async function registerUser(email: string, password: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { ok: false as const, status: 409 as const, body: { code: "EMAIL_TAKEN", message: "该邮箱已注册" } };

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, passwordHash },
    select: { id: true, email: true },
  });
  const accessToken = signAccessToken({ sub: user.id });
  return { ok: true as const, status: 201 as const, body: { user, accessToken } };
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { ok: false as const, status: 401 as const, body: { code: "INVALID_CREDENTIALS", message: "账号或密码错误" } };

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return { ok: false as const, status: 401 as const, body: { code: "INVALID_CREDENTIALS", message: "账号或密码错误" } };

  const accessToken = signAccessToken({ sub: user.id });
  return {
    ok: true as const,
    status: 200 as const,
    body: { user: { id: user.id, email: user.email }, accessToken },
  };
}

export async function getMe(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  const match = auth.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]?.trim();
  if (!token) return { ok: false as const, status: 401 as const, body: { code: "UNAUTHORIZED", message: "登录已失效" } };

  const payload = verifyAccessToken(token);
  if (!payload) return { ok: false as const, status: 401 as const, body: { code: "UNAUTHORIZED", message: "登录已失效" } };

  const user = await prisma.user.findUnique({ where: { id: payload.sub }, select: { id: true, email: true } });
  if (!user) return { ok: false as const, status: 401 as const, body: { code: "UNAUTHORIZED", message: "登录已失效" } };

  return { ok: true as const, status: 200 as const, body: { user } };
}

