import { describe, expect, test } from "bun:test";

import { formatGanzhiYearMonth, getGanzhiFourPillars } from "../lunarGanzhi";

describe("lunarGanzhi helpers", () => {
  test("formatGanzhiYearMonth formats year/month pillar", () => {
    expect(formatGanzhiYearMonth(new Date(2026, 0, 29, 12, 0, 0))).toBe("乙巳年 己丑月");
  });

  test("getGanzhiFourPillars returns four pillars and xun kong", () => {
    const p = getGanzhiFourPillars(new Date(2026, 0, 24, 18, 39, 0));
    expect(p.yearGanzhi).toBe("乙巳");
    expect(p.monthGanzhi).toBe("己丑");
    expect(p.dayGanzhi).toBe("戊戌");
    expect(p.hourGanzhi).toBe("辛酉");
    expect(p.xunKong).toBe("辰巳");
  });
});
