export function parseExtractRequestBody(body: unknown):
  | { kind: "text"; text: string; model?: string }
  | { kind: "image"; image: { data: string; mimeType: string }; model?: string }
  | null {
  if (typeof body !== "object" || body === null) return null;
  const obj = body as Record<string, unknown>;

  const model = obj.model;
  if (typeof model !== "undefined") {
    if (typeof model !== "string") return null;
    const trimmed = model.trim();
    if (!trimmed) return null;
    if (trimmed.length > 80) return null;
  }

  if (typeof obj.text === "string") {
    return { kind: "text", text: obj.text, model: typeof model === "string" ? model.trim() : undefined };
  }

  const image = obj.image;
  if (typeof image === "object" && image !== null) {
    const imageObj = image as Record<string, unknown>;
    if (typeof imageObj.data === "string" && typeof imageObj.mimeType === "string") {
    return {
      kind: "image",
        image: { data: imageObj.data, mimeType: imageObj.mimeType },
        model: typeof model === "string" ? model.trim() : undefined,
    };
    }
  }

  return null;
}
