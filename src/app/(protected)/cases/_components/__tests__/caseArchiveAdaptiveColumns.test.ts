import { describe, expect, test } from "bun:test";

describe("case archive grids", () => {
  test("adapt columns when there are fewer than 3 items", async () => {
    const baziSource = await Bun.file(new URL("../caseBazi.tsx", import.meta.url)).text();
    const liuyaoSource = await Bun.file(new URL("../caseLiuyao.tsx", import.meta.url)).text();

    for (const source of [baziSource, liuyaoSource]) {
      expect(source).toContain('if (count === 1) return "grid grid-cols-1 gap-px"');
      expect(source).toContain('if (count === 2) return "grid grid-cols-1 md:grid-cols-2 gap-px"');
    }
  });
});

