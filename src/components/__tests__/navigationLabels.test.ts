import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";

describe("navigation and page labels", () => {
  test("sidebar labels use the updated wording", async () => {
    const layoutSource = await readFile("src/components/Layout.tsx", "utf8");
    expect(layoutSource).toContain('label="案头"');
    expect(layoutSource).toContain('label="缘主档案"');
    expect(layoutSource).toContain('label="八字断语"');
    expect(layoutSource).toContain('label="六爻断辞"');
    expect(layoutSource).toContain('label="六爻卦谱"');
    expect(layoutSource).toContain('label="全册检索 (Ctrl+K)"');
  });

  test("dashboard card titles use the updated wording", async () => {
    const dashboardSource = await readFile("src/app/(protected)/page.tsx", "utf8");
    expect(dashboardSource).toContain('title: "缘主档案"');
    expect(dashboardSource).toContain('title: "六爻卦谱"');
  });
});

