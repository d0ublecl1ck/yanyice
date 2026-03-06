import type { OutgoingHttpHeaders } from "node:http";

import { getApp } from "../../../../server/src/appSingleton";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ path: string[] }> | { path: string[] } };

function buildApiPath(req: Request, segments: string[]) {
  const url = new URL(req.url);
  const pathname = `/api/${segments.join("/")}`;
  return `${pathname}${url.search}`;
}

function copyRequestHeaders(req: Request) {
  const headers: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === "host" || lower === "connection" || lower === "content-length") return;
    headers[key] = value;
  });
  return headers;
}

function copyResponseHeaders(source: OutgoingHttpHeaders) {
  const headers = new Headers();
  for (const [key, value] of Object.entries(source)) {
    const lower = key.toLowerCase();
    if (value == null || lower === "content-length" || lower === "transfer-encoding" || lower === "connection") {
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        headers.append(key, String(item));
      }
      continue;
    }
    headers.append(key, String(value));
  }
  return headers;
}

async function handle(req: Request, context: RouteContext) {
  try {
    const app = await getApp();
    const { path } = await Promise.resolve(context.params);
    const method = req.method.toUpperCase() as "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS" | "HEAD";
    const payload = method === "GET" || method === "HEAD" ? undefined : Buffer.from(await req.arrayBuffer());

    const response = await app.inject({
      method,
      url: buildApiPath(req, path),
      headers: copyRequestHeaders(req),
      payload,
    });

    return new Response(response.body, {
      status: response.statusCode,
      headers: copyResponseHeaders(response.headers),
    });
  } catch (error) {
    console.error("API bridge failure", error);
    return Response.json(
      {
        code: "API_BRIDGE_ERROR",
        message: error instanceof Error ? error.message : "Unknown API bridge error",
      },
      { status: 500 },
    );
  }
}

export async function GET(req: Request, context: RouteContext) {
  return handle(req, context);
}

export async function POST(req: Request, context: RouteContext) {
  return handle(req, context);
}

export async function PUT(req: Request, context: RouteContext) {
  return handle(req, context);
}

export async function PATCH(req: Request, context: RouteContext) {
  return handle(req, context);
}

export async function DELETE(req: Request, context: RouteContext) {
  return handle(req, context);
}

export async function OPTIONS(req: Request, context: RouteContext) {
  return handle(req, context);
}
