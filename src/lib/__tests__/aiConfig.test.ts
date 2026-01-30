import { describe, expect, test } from "bun:test";

import {
  getDefaultAiConfig,
  sanitizeAiModel,
  sanitizeAiVendor,
} from "../aiConfig";

describe("aiConfig", () => {
  test("getDefaultAiConfig returns stable defaults", () => {
    expect(getDefaultAiConfig()).toEqual({
      vendor: "google",
      model: "gemini-3-pro-preview",
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
    expect(sanitizeAiModel("")).toBeNull();
    expect(sanitizeAiModel("   ")).toBeNull();
    expect(sanitizeAiModel("x".repeat(81))).toBeNull();
  });
});

