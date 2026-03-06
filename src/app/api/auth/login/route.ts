import { NextResponse } from "next/server";

import { jsonError, loginUser, parseAuthBody } from "../_auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await parseAuthBody(req);
  if (!body) return jsonError(400, { code: "INVALID_BODY", message: "请求参数错误" });

  const result = await loginUser(body.email, body.password);
  if (!result.ok) return jsonError(result.status, result.body);
  return NextResponse.json(result.body, { status: 200 });
}

