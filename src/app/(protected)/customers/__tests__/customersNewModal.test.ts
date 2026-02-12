import { describe, expect, test } from "bun:test";

describe("customers create modal routing", () => {
  test("no longer links to /customers/new", async () => {
    const dashboardSource = await Bun.file(new URL("../../page.tsx", import.meta.url)).text();
    const customersListSource = await Bun.file(new URL("../page.tsx", import.meta.url)).text();
    const layoutSource = await Bun.file(new URL("../../../../components/Layout.tsx", import.meta.url)).text();

    for (const source of [dashboardSource, customersListSource, layoutSource]) {
      expect(source).not.toContain('href="/customers/new"');
      expect(source).not.toContain("href='/customers/new'");
      expect(source).not.toContain("/customers/new");
    }
  });

  test("/customers/new redirects to /customers?new=1", async () => {
    const legacyPageSource = await Bun.file(new URL("../new/page.tsx", import.meta.url)).text();
    expect(legacyPageSource).toContain('redirect("/customers?new=1")');
  });
});
