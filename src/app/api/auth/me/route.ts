import { NextResponse } from "next/server";

import { getMe, jsonError } from "../_auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const result = await getMe(req);
  if (!result.ok) return jsonError(result.status, result.body);
  return NextResponse.json(result.body, { status: 200 });
}

