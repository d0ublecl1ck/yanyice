import { describe, expect, test } from "bun:test";
import { parseExtractRequestBody } from "../../../pages/api/gemini/extract";

describe("parseExtractRequestBody", () => {
  test("accepts text payload", () => {
    expect(parseExtractRequestBody({ text: "hello" })).toEqual({
      kind: "text",
      text: "hello",
    });
  });

  test("accepts image payload", () => {
    expect(
      parseExtractRequestBody({ image: { data: "base64", mimeType: "image/png" } }),
    ).toEqual({
      kind: "image",
      image: { data: "base64", mimeType: "image/png" },
    });
  });

  test("rejects invalid payloads", () => {
    expect(parseExtractRequestBody(null)).toBeNull();
    expect(parseExtractRequestBody({})).toBeNull();
    expect(parseExtractRequestBody({ text: 123 })).toBeNull();
    expect(parseExtractRequestBody({ image: { data: "x" } })).toBeNull();
    expect(parseExtractRequestBody({ image: { mimeType: "image/png" } })).toBeNull();
  });
});

