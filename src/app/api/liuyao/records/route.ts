import { NextResponse } from "next/server";

import {
  createLiuyaoRecordForUser,
  getAuthorizedUserId,
  jsonError,
  listLiuyaoRecordsForUser,
  parseCreateBody,
} from "../_records";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const userId = await getAuthorizedUserId(req);
  if (!userId) return jsonError(401, { code: "UNAUTHORIZED", message: "登录已失效" });

  const records = await listLiuyaoRecordsForUser(userId);
  return NextResponse.json({ records }, { status: 200 });
}

export async function POST(req: Request) {
  const userId = await getAuthorizedUserId(req);
  if (!userId) return jsonError(401, { code: "UNAUTHORIZED", message: "登录已失效" });

  const body = await parseCreateBody(req);
  if (!body) return jsonError(400, { code: "INVALID_BODY", message: "请求参数错误" });

  const record = await createLiuyaoRecordForUser(userId, body);
  return NextResponse.json({ record }, { status: 201 });
}
