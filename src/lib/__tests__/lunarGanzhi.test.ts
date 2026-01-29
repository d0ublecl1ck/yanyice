import { describe, expect, test } from "bun:test";

import { formatGanzhiYearMonth } from "../lunarGanzhi";

describe("lunarGanzhi helpers", () => {
  test("formatGanzhiYearMonth formats year/month pillar", () => {
    expect(formatGanzhiYearMonth(new Date(2026, 0, 29, 12, 0, 0))).toBe("乙巳年 己丑月");
  });
});

