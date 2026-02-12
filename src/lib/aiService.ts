import { apiFetch } from "@/lib/apiClient";

export type ChatMessage = { role: "user" | "model"; text: string };

export async function aiChat(params: {
  accessToken: string;
  systemInstruction: string;
  messages: ChatMessage[];
}): Promise<string> {
  const data = await apiFetch<{ text?: string }>("/api/ai/chat", {
    method: "POST",
    accessToken: params.accessToken,
    body: JSON.stringify({
      systemInstruction: params.systemInstruction,
      messages: params.messages,
    }),
  });
  return data.text ?? "";
}

