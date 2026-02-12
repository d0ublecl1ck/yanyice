import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";

describe("recent/global navigation", () => {
  test("dashboard recent records link to analysis (not cases/edit)", async () => {
    const source = await readFile("src/app/(protected)/page.tsx", "utf8");
    expect(source).not.toContain("/cases/edit/");
    expect(source).toContain("recordAnalysisHref");
  });

  test("global search routes to customer view and record analysis", async () => {
    const source = await readFile("src/components/GlobalSearch.tsx", "utf8");
    expect(source).not.toContain("/cases/edit/");
    expect(source).not.toContain("/customers/edit/");
    expect(source).toContain("/customers/view/");
    expect(source).toContain("recordAnalysisHref");
  });

  test("liuyao edit page no longer redirects via cases/edit", async () => {
    const source = await readFile("src/app/(protected)/liuyao/edit/[id]/page.tsx", "utf8");
    expect(source).not.toContain("/cases/edit/");
    expect(source).toContain("CaseEditView");
  });
});

