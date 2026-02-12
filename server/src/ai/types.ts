import type { AiVendor } from "@prisma/client";

export type AiRole = "system" | "user" | "assistant";

export type AiMessage =
  | { role: AiRole; content: string }
  | {
      role: AiRole;
      content: Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }>;
    };

export type AiChatRequest = {
  vendor: AiVendor;
  apiKey: string;
  model: string;
  messages: AiMessage[];
};

