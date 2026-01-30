import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";

describe("bazi analysis fortunes panel", () => {
  test("renders decade/year/month interactive sections", async () => {
    const source = await readFile("src/app/(protected)/bazi/analysis/[id]/page.tsx", "utf8");
    expect(source).toContain("function BaziFortunePanel");
    expect(source).toContain("运势推演");
    expect(source).toContain("大运");
    expect(source).toContain("流年");
    expect(source).toContain("流月");
    expect(source).toContain("setSelectedDecadeIndex");
    expect(source).toContain("setSelectedYearIndex");
  });
});

