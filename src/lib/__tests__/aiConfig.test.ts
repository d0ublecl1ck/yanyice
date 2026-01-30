import { describe, expect, test } from "bun:test";

import {
  getDefaultAiConfig,
  sanitizeAiApiKey,
  sanitizeAiModel,
  sanitizeAiVendor,
} from "../aiConfig";

describe("aiConfig", () => {
  test("getDefaultAiConfig returns stable defaults", () => {
    expect(getDefaultAiConfig()).toEqual({
      vendor: "zhipu",
      model: "",
      apiKey: "",
    });
  });

  test("sanitizeAiVendor trims and rejects invalid", () => {
    expect(sanitizeAiVendor("  google  ")).toBe("google");
    expect(sanitizeAiVendor("")).toBeNull();
    expect(sanitizeAiVendor("   ")).toBeNull();
    expect(sanitizeAiVendor("x".repeat(49))).toBeNull();
  });

  test("sanitizeAiModel trims and rejects invalid", () => {
    expect(sanitizeAiModel("  gemini-3-pro-preview  ")).toBe("gemini-3-pro-preview");
    expect(sanitizeAiModel("")).toBe("");
    expect(sanitizeAiModel("   ")).toBe("");
    expect(sanitizeAiModel("x".repeat(81))).toBeNull();
  });

  test("sanitizeAiApiKey trims and rejects invalid", () => {
    expect(sanitizeAiApiKey("  sk-test  ")).toBe("sk-test");
    expect(sanitizeAiApiKey("")).toBe("");
    expect(sanitizeAiApiKey("x".repeat(201))).toBeNull();
  });
});
