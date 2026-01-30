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
    throw new Error(msg);
  }

  return json?.choices?.[0]?.message?.content ?? "";
}

export async function zhipuChatJson(params: ZhipuChatRequest): Promise<unknown> {
  const text = await zhipuChat(params);
  return extractFirstJsonObject(text);
}

