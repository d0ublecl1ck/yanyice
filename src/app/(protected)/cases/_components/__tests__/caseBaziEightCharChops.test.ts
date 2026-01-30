import { describe, expect, test } from "bun:test";

describe("bazi case cards", () => {
  test("render eight characters as compact round chops", async () => {
    const source = await Bun.file(new URL("../caseBazi.tsx", import.meta.url)).text();

    expect(source).toContain("function BaziEightCharChops");
    expect(source).toContain("grid-cols-4");
    expect(source).toContain("rounded-full");
    expect(source).toContain("flex items-center gap-3");

    expect(source).not.toContain("b?.yearStem");
    expect(source).not.toContain("b?.monthStem");
    expect(source).not.toContain("b?.dayStem");
    expect(source).not.toContain("b?.hourStem");
  });
});
