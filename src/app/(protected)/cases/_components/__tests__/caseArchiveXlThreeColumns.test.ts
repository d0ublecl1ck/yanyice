import { describe, expect, test } from "bun:test";

describe("archives grid columns", () => {
  test("bazi archives use 3 columns on xl screens", async () => {
    const source = await Bun.file(new URL("../caseBazi.tsx", import.meta.url)).text();
    expect(source).toContain("xl:grid-cols-3");
  });

  test("liuyao archives use 3 columns on xl screens", async () => {
    const source = await Bun.file(new URL("../caseLiuyao.tsx", import.meta.url)).text();
    expect(source).toContain("xl:grid-cols-3");
  });
});

