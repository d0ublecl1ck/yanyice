import type { AiChatRequest } from "./types";
import { openaiChat, openaiChatJson } from "./openai";
import { zhipuChat, zhipuChatJson } from "./zhipu";

export async function aiChat(params: AiChatRequest): Promise<string> {
  if (params.vendor === "zhipu") return zhipuChat(params);
  if (params.vendor === "openai") return openaiChat(params);
  throw new Error("UNSUPPORTED_VENDOR");
}

export async function aiChatJson(params: AiChatRequest): Promise<unknown> {
  if (params.vendor === "zhipu") return zhipuChatJson(params);
  if (params.vendor === "openai") return openaiChatJson(params);
  throw new Error("UNSUPPORTED_VENDOR");
}
