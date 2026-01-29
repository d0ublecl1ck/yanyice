import { describe, expect, test } from "bun:test";

describe("case list components", () => {
  test("do not show the case feedback label", async () => {
    const caseAllSource = await Bun.file(new URL("../caseAll.tsx", import.meta.url)).text();
    const caseLiuyaoSource = await Bun.file(new URL("../caseLiuyao.tsx", import.meta.url)).text();

    for (const source of [caseAllSource, caseLiuyaoSource]) {
      expect(source).not.toContain("已反馈: 准确");
      expect(source).not.toContain("未反馈");
    }
  });
});

