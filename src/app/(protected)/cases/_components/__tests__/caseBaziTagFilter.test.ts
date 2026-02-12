import { describe, expect, test } from "bun:test";

describe("CaseBazi tags", () => {
  test("shows tags on cards and supports tag filtering UI", async () => {
    const layoutSource = await Bun.file(
      new URL("../CaseArchiveLayout.tsx", import.meta.url),
    ).text();
    const source = await Bun.file(new URL("../caseBazi.tsx", import.meta.url)).text();

    expect(layoutSource).toContain("标签筛选");
    expect(layoutSource).toContain("清除筛选");
    expect(source).toContain("const [activeTag, setActiveTag]");
    expect(source).toContain("const matchesTag");
    expect(source).toContain("tagOptions={availableTags}");
    expect(source).toContain("record.tags.length > 0");
    expect(source).toContain("record.tags.slice(0, 3)");
  });
});

