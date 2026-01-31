import { describe, expect, test } from "bun:test";

import { fuzzyMatchScore } from "@/components/SearchSelect";

describe("SearchSelect", () => {
  test("fuzzyMatchScore returns a score when query is a subsequence", () => {
    expect(fuzzyMatchScore("地水师", "地师")).not.toBeNull();
    expect(fuzzyMatchScore("地水师", "水师")).not.toBeNull();
  });

  test("fuzzyMatchScore returns null when query cannot match", () => {
    expect(fuzzyMatchScore("地水师", "天地否")).toBeNull();
  });

  test("fuzzyMatchScore prefers earlier/denser matches", () => {
    const a = fuzzyMatchScore("天地否", "天地")!;
    const b = fuzzyMatchScore("风天地否", "天地")!;
    expect(a).toBeGreaterThan(b);
  });
});

