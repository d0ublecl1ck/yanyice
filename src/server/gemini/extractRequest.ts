export type ExtractRequestBody =
  | { text: string }
  | { image: { data: string; mimeType: string } };

export function parseExtractRequestBody(body: unknown):
  | { kind: "text"; text: string }
  | { kind: "image"; image: { data: string; mimeType: string } }
  | null {
  if (typeof body !== "object" || body === null) return null;
  const obj = body as Record<string, unknown>;

  if (typeof obj.text === "string") {
    return { kind: "text", text: obj.text };
  }

  const image = obj.image;
  if (typeof image === "object" && image !== null) {
    const imageObj = image as Record<string, unknown>;
    if (typeof imageObj.data === "string" && typeof imageObj.mimeType === "string") {
    return {
      kind: "image",
        image: { data: imageObj.data, mimeType: imageObj.mimeType },
    };
    }
  }

  return null;
}
