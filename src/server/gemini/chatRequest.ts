export type ChatRequestBody = {
  systemInstruction: string;
  messages: Array<{ role: "user" | "model"; text: string }>;
  model?: string;
};

export function parseChatRequestBody(body: unknown): ChatRequestBody | null {
  if (typeof body !== "object" || body === null) return null;
  const obj = body as Record<string, unknown>;

  if (typeof obj.systemInstruction !== "string") return null;
  if (!Array.isArray(obj.messages)) return null;

  const model = obj.model;
  if (typeof model !== "undefined") {
    if (typeof model !== "string") return null;
    const trimmed = model.trim();
    if (!trimmed) return null;
    if (trimmed.length > 80) return null;
  }

  const parsed: Array<{ role: "user" | "model"; text: string }> = [];
  for (const msg of obj.messages) {
    if (typeof msg !== "object" || msg === null) return null;
    const m = msg as Record<string, unknown>;
    const role = m.role;
    const text = m.text;
    if (role !== "user" && role !== "model") return null;
    if (typeof text !== "string") return null;
    parsed.push({ role, text });
  }

  return {
    systemInstruction: obj.systemInstruction,
    messages: parsed,
    model: typeof obj.model === "string" ? obj.model.trim() : undefined,
  };
}
