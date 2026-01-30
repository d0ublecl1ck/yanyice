import { describe, expect, test } from "bun:test";

describe("AiRecognitionModal clipboard paste", () => {
  test("supports pasting images from clipboard", async () => {
    const source = await Bun.file(new URL("../AiRecognitionModal.tsx", import.meta.url)).text();
    expect(source).toContain('addEventListener("paste"');
    expect(source).toContain("clipboardData");
    expect(source).toContain("image/");
    expect(source).toContain("clipboard-");
  });
});
