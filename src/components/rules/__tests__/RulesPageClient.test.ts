import { describe, expect, test } from "bun:test";

describe("RulesPageClient copy", () => {
  test("does not render the empty-state middle '新建规则' button", async () => {
    const file = Bun.file("src/components/rules/RulesPageClient.tsx");
    const content = await file.text();
    const occurrences = content.split("新建规则").length - 1;
    expect(occurrences).toBe(2);
  });
});

