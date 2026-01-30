import { describe, expect, test } from "bun:test";
import { parseExtractRequestBody } from "../gemini/extractRequest";

describe("parseExtractRequestBody", () => {
  test("accepts text payload", () => {
    expect(parseExtractRequestBody({ text: "hello", model: "gemini-3-pro-preview" })).toEqual({
      kind: "text",
      text: "hello",
      model: "gemini-3-pro-preview",
    });
  });

  test("accepts image payload", () => {
    expect(
      parseExtractRequestBody({
        image: { data: "base64", mimeType: "image/png" },
        model: "gemini-3-pro-preview",
      }),
    ).toEqual({
      kind: "image",
      image: { data: "base64", mimeType: "image/png" },
      model: "gemini-3-pro-preview",
    });
  });

  test("rejects invalid payloads", () => {
    expect(parseExtractRequestBody(null)).toBeNull();
    expect(parseExtractRequestBody({})).toBeNull();
    expect(parseExtractRequestBody({ text: 123 })).toBeNull();
    expect(parseExtractRequestBody({ image: { data: "x" } })).toBeNull();
    expect(parseExtractRequestBody({ image: { mimeType: "image/png" } })).toBeNull();
    expect(parseExtractRequestBody({ text: "ok", model: 123 })).toBeNull();
    expect(parseExtractRequestBody({ text: "ok", model: "   " })).toBeNull();
  });
});
