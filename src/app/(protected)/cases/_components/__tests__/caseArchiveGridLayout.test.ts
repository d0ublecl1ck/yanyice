import { describe, expect, test } from "bun:test";

describe("case archive grids", () => {
  test("bazi and liuyao archives use 4-column grid on large screens", async () => {
    const baziSource = await Bun.file(new URL("../caseBazi.tsx", import.meta.url)).text();
    const liuyaoSource = await Bun.file(new URL("../caseLiuyao.tsx", import.meta.url)).text();

    for (const source of [baziSource, liuyaoSource]) {
      expect(source).toContain("md:grid-cols-2");
      expect(source).toContain("lg:grid-cols-4");
      expect(source).toContain("gap-px");
    }
  });
});

