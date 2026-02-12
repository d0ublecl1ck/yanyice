import { describe, expect, test } from "bun:test";

describe("customer pages case links", () => {
  test("customer view/history should link to module preview (analysis) instead of edit", async () => {
    const customerViewSource = await Bun.file(
      new URL("../view/[id]/CustomerViewClient.tsx", import.meta.url),
    ).text();
    const customerHistorySource = await Bun.file(
      new URL("../history/[id]/CustomerHistoryClient.tsx", import.meta.url),
    ).text();

    for (const source of [customerViewSource, customerHistorySource]) {
      expect(source).not.toContain("/cases/edit/");
      expect(source).toContain("recordAnalysisHref");
    }
  });
});

