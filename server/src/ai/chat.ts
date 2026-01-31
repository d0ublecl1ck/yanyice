import type { AiChatRequest } from "./types";
import { extractFirstJsonObject } from "./extractJson";
import { openaiChat } from "./openai";
import { zhipuChat } from "./zhipu";

export async function aiChat(params: AiChatRequest): Promise<string> {
  if (params.vendor === "zhipu") return zhipuChat(params);
  if (params.vendor === "openai") return openaiChat(params);
  throw new Error("UNSUPPORTED_VENDOR");
}

export async function aiChatJson(params: AiChatRequest): Promise<unknown> {
  const text = await aiChat(params);
  return extractFirstJsonObject(text);
}

