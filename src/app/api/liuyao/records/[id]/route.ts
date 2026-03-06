import { NextResponse } from "next/server";

import {
  deleteLiuyaoRecordForUser,
  getAuthorizedUserId,
  getLiuyaoRecordForUser,
  jsonError,
  parseUpdateBody,
  updateLiuyaoRecordForUser,
} from "../../_records";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> | { id: string } };

async function resolveId(context: RouteContext): Promise<string> {
  const params = await Promise.resolve(context.params);
  return params.id;
}

export async function GET(req: Request, context: RouteContext) {
  const userId = await getAuthorizedUserId(req);
  if (!userId) return jsonError(401, { code: "UNAUTHORIZED", message: "登录已失效" });

  const id = await resolveId(context);
  const record = await getLiuyaoRecordForUser(userId, id);
  if (!record) return jsonError(404, { code: "NOT_FOUND", message: "记录不存在" });

  return NextResponse.json({ record }, { status: 200 });
}

export async function PUT(req: Request, context: RouteContext) {
  const userId = await getAuthorizedUserId(req);
  if (!userId) return jsonError(401, { code: "UNAUTHORIZED", message: "登录已失效" });

  const updates = await parseUpdateBody(req);
  if (!updates) return jsonError(400, { code: "INVALID_BODY", message: "请求参数错误" });

  const id = await resolveId(context);
  const record = await updateLiuyaoRecordForUser(userId, id, updates);
  if (!record) return jsonError(404, { code: "NOT_FOUND", message: "记录不存在" });

  return NextResponse.json({ record }, { status: 200 });
}

export async function DELETE(req: Request, context: RouteContext) {
  const userId = await getAuthorizedUserId(req);
  if (!userId) return jsonError(401, { code: "UNAUTHORIZED", message: "登录已失效" });

  const id = await resolveId(context);
  const ok = await deleteLiuyaoRecordForUser(userId, id);
  if (!ok) return jsonError(404, { code: "NOT_FOUND", message: "记录不存在" });

  return NextResponse.json({ ok: true }, { status: 200 });
}
