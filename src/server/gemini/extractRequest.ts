export type ExtractRequestBody =
  | { text: string }
  | { image: { data: string; mimeType: string } };

export function parseExtractRequestBody(body: unknown):
  | { kind: "text"; text: string }
  | { kind: "image"; image: { data: string; mimeType: string } }
  | null {
  if (typeof body !== "object" || body === null) return null;
  const anyBody = body as any;

  if (typeof anyBody.text === "string") {
    return { kind: "text", text: anyBody.text };
  }

  if (
    typeof anyBody.image?.data === "string" &&
    typeof anyBody.image?.mimeType === "string"
  ) {
    return {
      kind: "image",
      image: { data: anyBody.image.data, mimeType: anyBody.image.mimeType },
    };
  }

  return null;
}

