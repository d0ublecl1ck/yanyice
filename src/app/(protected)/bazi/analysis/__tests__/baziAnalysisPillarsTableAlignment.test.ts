import { describe, expect, test } from "bun:test";

describe("bazi analysis pillars table", () => {
  test("defines stable column widths so header aligns with rows", async () => {
    const source = await Bun.file(new URL("../[id]/page.tsx", import.meta.url)).text();

    expect(source).toContain("<colgroup>");
    expect(source).toContain('<col className="w-16" />');
    expect(source).toContain('w-[calc((100%-4rem)/4)]');
    expect(source).not.toContain("tracking-[0.5em]");
  });
});

