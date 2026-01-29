import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";

describe("layout width constraints", () => {
  test("protected layout container uses wider max width", async () => {
    const layoutSource = await readFile("src/components/Layout.tsx", "utf8");
    expect(layoutSource).toContain("max-w-7xl mx-auto");
    expect(layoutSource).not.toContain("max-w-5xl mx-auto");
  });

  test("bazi edit view uses full available width", async () => {
    const source = await readFile(
      "src/app/(protected)/bazi/_components/BaziEditView.tsx",
      "utf8",
    );
    expect(source).toContain('className="w-full max-w-none');
    expect(source).not.toContain("max-w-2xl mx-auto");
  });
});

