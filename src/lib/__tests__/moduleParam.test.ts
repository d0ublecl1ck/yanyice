import { describe, expect, test } from "bun:test";

import { coerceCaseFilter, coerceModuleType } from "../moduleParam";

describe("moduleParam", () => {
  test("coerceModuleType returns null for unknown values", () => {
    expect(coerceModuleType(null)).toBe(null);
    expect(coerceModuleType(undefined)).toBe(null);
    expect(coerceModuleType("")).toBe(null);
    expect(coerceModuleType("foo")).toBe(null);
  });

  test("coerceModuleType accepts bazi/liuyao", () => {
    expect(coerceModuleType("bazi")).toBe("bazi");
    expect(coerceModuleType("liuyao")).toBe("liuyao");
  });

  test("coerceCaseFilter accepts all/bazi/liuyao", () => {
    expect(coerceCaseFilter("all")).toBe("all");
    expect(coerceCaseFilter("bazi")).toBe("bazi");
    expect(coerceCaseFilter("liuyao")).toBe("liuyao");
  });
});

