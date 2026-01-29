import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";

describe("layout width constraints", () => {
  test("protected layout container uses wider max width", async () => {
    const layoutSource = await readFile("src/components/Layout.tsx", "utf8");
    expect(layoutSource).toContain("max-w-[90vw] mx-auto");
    expect(layoutSource).not.toContain("max-w-5xl mx-auto");
    expect(layoutSource).not.toContain("max-w-7xl mx-auto");
  });

  test("sidebar uses the custom module svg icons", async () => {
    const layoutSource = await readFile("src/components/Layout.tsx", "utf8");
    expect(layoutSource).toContain("/icons/sidebar/bazi-cases.svg");
    expect(layoutSource).toContain("/icons/sidebar/bazi-rules.svg");
    expect(layoutSource).toContain("/icons/sidebar/liuyao-examples.svg");
    expect(layoutSource).toContain("/icons/sidebar/liuyao-rules.svg");
  });

  test("bazi edit view uses full available width", async () => {
    const source = await readFile(
      "src/app/(protected)/bazi/_components/BaziEditView.tsx",
      "utf8",
    );
    expect(source).toContain('className="w-full max-w-none');
    expect(source).not.toContain("max-w-2xl mx-auto");
  });

  test("settings page uses a two-column grid on large screens", async () => {
    const source = await readFile("src/app/(protected)/settings/page.tsx", "utf8");
    expect(source).toContain("grid-cols-1 lg:grid-cols-2");
    expect(source).toContain("lg:col-span-2");
  });

  test("bazi archives uses a two-column grid on medium screens", async () => {
    const source = await readFile("src/app/(protected)/cases/_components/caseBazi.tsx", "utf8");
    expect(source).toContain("md:grid-cols-2");
    expect(source).toContain("gap-px");
  });
});
