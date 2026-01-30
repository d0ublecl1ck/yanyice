import { describe, expect, it } from "bun:test";

import { selectDailyQuotes } from "@/lib/quotes";

describe("selectDailyQuotes", () => {
  it("returns only enabled quotes and is stable for the same day", () => {
    const quotes = [
      { id: "1", text: "a", enabled: true, isSystem: true },
      { id: "2", text: "b", enabled: false, isSystem: true },
      { id: "3", text: "c", enabled: true, isSystem: false },
      { id: "4", text: "d", enabled: true, isSystem: false },
    ];

    const date = new Date("2026-01-30T12:00:00.000Z");
    const first = selectDailyQuotes({ quotes, date, userSeed: "u1", count: 2 }).map((q) => q.id);
    const second = selectDailyQuotes({ quotes, date, userSeed: "u1", count: 2 }).map((q) => q.id);

    expect(first).toEqual(second);
    expect(first).toHaveLength(2);
    expect(first).not.toContain("2");
  });

  it("caps count to enabled length", () => {
    const quotes = [
      { id: "1", text: "a", enabled: true, isSystem: true },
      { id: "2", text: "b", enabled: true, isSystem: true },
    ];

    const selected = selectDailyQuotes({
      quotes,
      date: new Date("2026-01-30T00:00:00.000Z"),
      userSeed: "u1",
      count: 10,
    });
    expect(selected).toHaveLength(2);
  });
});

