import type { AiVendor } from "@prisma/client";

export type ZhipuRole = "system" | "user" | "assistant";

export type ZhipuMessage =
  | { role: ZhipuRole; content: string }
  | {
      role: ZhipuRole;
      content: Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }>;
    };

export type ZhipuChatRequest = {
  vendor: AiVendor;
  apiKey: string;
  model: string;
  messages: ZhipuMessage[];
};

type ZhipuRateLimitError = Error & { code: "ZHIPU_RATE_LIMIT"; statusCode: 429 };

const isRateLimitMessage = (msg: string) => {
  const s = msg.trim();
  return (
    s.includes("请求过多") ||
    s.includes("Too Many Requests") ||
    s.includes("rate limit") ||
    s.includes("Rate limit") ||
    s.includes("429")
  );
};

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const toRateLimitError = (message: string): ZhipuRateLimitError => {
  const err = new Error(message) as ZhipuRateLimitError;
  err.code = "ZHIPU_RATE_LIMIT";
  err.statusCode = 429;
  return err;
};

function extractFirstJsonObject(text: string): unknown {
  const s = text.trim();
  if (s.startsWith("{") || s.startsWith("[")) {
    try {
      return JSON.parse(s);
    } catch {
      // fallthrough
    }
  }

  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start >= 0 && end > start) {
    const candidate = s.slice(start, end + 1);
    return JSON.parse(candidate);
  }

  throw new Error("NO_JSON");
}

export async function zhipuChat(params: ZhipuChatRequest): Promise<string> {
  if (params.vendor !== "zhipu") throw new Error("UNSUPPORTED_VENDOR");
  const url = "https://open.bigmodel.cn/api/paas/v4/chat/completions";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${params.apiKey}`,
    },
    body: JSON.stringify({
      model: params.model,
      messages: params.messages,
      stream: false,
    }),
  });

  const json = (await res.json().catch(() => null)) as
    | {
        error?: { message?: string };
        choices?: Array<{ message?: { content?: string } }>;
      }
    | null;

  if (!res.ok) {
    const msg = json?.error?.message || `Zhipu request failed (${res.status})`;
    if (res.status === 429 || isRateLimitMessage(msg)) throw toRateLimitError(msg);
    throw new Error(msg);
  }

  return json?.choices?.[0]?.message?.content ?? "";
}

export async function zhipuChatJson(params: ZhipuChatRequest): Promise<unknown> {
  const maxAttempts = 3;
  let lastErr: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const text = await zhipuChat(params);
      return extractFirstJsonObject(text);
    } catch (e) {
      lastErr = e;
      const err = e as Partial<ZhipuRateLimitError>;
      const isRateLimit = err?.code === "ZHIPU_RATE_LIMIT" || err?.statusCode === 429;

      if (!isRateLimit || attempt === maxAttempts) throw e;

      // Exponential backoff with small jitter.
      const baseMs = 250 * Math.pow(2, attempt - 1);
      const jitterMs = Math.floor(Math.random() * 120);
      await sleep(baseMs + jitterMs);
    }
  }

  // Should be unreachable; kept for type narrowing.
  throw lastErr instanceof Error ? lastErr : new Error("ZHIPU_RETRY_FAILED");
}
