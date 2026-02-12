import type { AiChatRequest } from "./types";
import { extractFirstJsonObject } from "./extractJson";

export async function openaiChat(params: AiChatRequest): Promise<string> {
  if (params.vendor !== "openai") throw new Error("UNSUPPORTED_VENDOR");

  const url = "https://api.openai.com/v1/chat/completions";
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
    const msg = json?.error?.message || `OpenAI request failed (${res.status})`;
    throw new Error(msg);
  }

  return json?.choices?.[0]?.message?.content ?? "";
}

export async function openaiChatJson(params: AiChatRequest): Promise<unknown> {
  const text = await openaiChat(params);
  return extractFirstJsonObject(text);
}
