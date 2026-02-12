import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";

describe("case navigation", () => {
  test("bazi archive row navigates to analysis", async () => {
    const source = await readFile("src/app/(protected)/cases/_components/caseBazi.tsx", "utf8");
    expect(source).toContain("onClick={() => router.push(analysisHref)}");
    expect(source).not.toContain("onClick={() => router.push(editHref)}");
  });

  test("liuyao archive row navigates to analysis", async () => {
    const source = await readFile("src/app/(protected)/cases/_components/caseLiuyao.tsx", "utf8");
    expect(source).toContain("onClick={() => router.push(analysisHref)}");
    expect(source).not.toContain("onClick={() => router.push(editHref)}");
  });
});

