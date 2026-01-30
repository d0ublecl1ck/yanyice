import { describe, expect, test } from "bun:test";

describe("CaseLiuyao layout", () => {
  test("renders the record list as a 2-column grid on md+ screens", async () => {
    const caseLiuyaoSource = await Bun.file(new URL("../caseLiuyao.tsx", import.meta.url)).text();

    expect(caseLiuyaoSource).toContain("grid grid-cols-1 md:grid-cols-2 gap-px");
  });
});

