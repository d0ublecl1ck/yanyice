import { getApiBaseUrl } from "@/lib/config";

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit & { accessToken?: string | null },
): Promise<T> {
  const url = `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = new Headers(init?.headers);
  headers.set("content-type", "application/json");
  if (init?.accessToken) headers.set("authorization", `Bearer ${init.accessToken}`);

  const response = await fetch(url, { ...init, headers });
  const contentType = response.headers.get("content-type") ?? "";

  const maybeJson = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : null;

  if (!response.ok) {
    const message =
      (maybeJson && typeof maybeJson === "object" && "message" in maybeJson && typeof maybeJson.message === "string"
        ? maybeJson.message
        : `请求失败 (${response.status})`);
    const code =
      (maybeJson && typeof maybeJson === "object" && "code" in maybeJson && typeof maybeJson.code === "string"
        ? maybeJson.code
        : undefined);
    throw new ApiError(message, response.status, code);
  }

  return maybeJson as T;
}

