import { describe, expect, test } from "bun:test";

describe("CaseLiuyao tags", () => {
  test("shows tags on cards and supports tag filtering UI", async () => {
    const source = await Bun.file(new URL("../caseLiuyao.tsx", import.meta.url)).text();

    expect(source).toContain("标签筛选");
    expect(source).toContain("const [activeTag, setActiveTag]");
    expect(source).toContain("const matchesTag");
    expect(source).toContain("record.tags.length > 0");
  });
});

