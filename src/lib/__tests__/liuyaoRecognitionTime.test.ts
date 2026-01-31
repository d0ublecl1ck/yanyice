import { describe, expect, test } from "bun:test";

import { parseLiuyaoDateTimeFromIsoLike, parseLiuyaoDateTimeFromSolarLike } from "@/lib/liuyao/recognitionTime";

describe("liuyao recognition time parsing", () => {
  test("parses Chinese datetime with lunar annotation", () => {
    const parsed = parseLiuyaoDateTimeFromIsoLike("2026年01月27日18:28（十二月初九）");
    expect(parsed).not.toBeNull();
    if (!parsed) return;

    const d = new Date(parsed.dateIso);
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth() + 1).toBe(1);
    expect(d.getDate()).toBe(27);
    expect(d.getHours()).toBe(18);
    expect(d.getMinutes()).toBe(28);
    expect(parsed.timeHHmm).toBe("18:28");
  });

  test("parses common ISO-like formats without timezone", () => {
    const parsed1 = parseLiuyaoDateTimeFromIsoLike("2026-01-27 18:28");
    const parsed2 = parseLiuyaoDateTimeFromIsoLike("2026/01/27 18:28");
    expect(parsed1?.timeHHmm).toBe("18:28");
    expect(parsed2?.timeHHmm).toBe("18:28");
  });

  test("parses solar object even when values are strings", () => {
    const parsed = parseLiuyaoDateTimeFromSolarLike({ y: "2026", m: "1", d: "27", h: "18", min: "28" });
    expect(parsed?.timeHHmm).toBe("18:28");
    if (!parsed) return;

    const d = new Date(parsed.dateIso);
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth() + 1).toBe(1);
    expect(d.getDate()).toBe(27);
    expect(d.getHours()).toBe(18);
    expect(d.getMinutes()).toBe(28);
  });
});

