import { describe, expect, test } from "bun:test";

import { normalizeLiuyaoAiPrefill } from "@/lib/liuyao/aiPrefill";
import { LineType } from "@/lib/types";

describe("liuyao ai prefill normalize", () => {
  test("maps gender and single xx卦 tag", () => {
    const r = normalizeLiuyaoAiPrefill({ gender: "男", tags: ["感情卦"] });
    expect(r.gender).toBe("male");
    expect(r.tag).toBe("感情卦");
  });

  test("derives tag from topic when tags missing", () => {
    const r = normalizeLiuyaoAiPrefill({ topic: "寻物" });
    expect(r.tag).toBe("寻物卦");
  });

  test("parses pan.lines text into LineType[]", () => {
    const r = normalizeLiuyaoAiPrefill({
      pan: { lines: ["少阳", "少阴", "老阳", "老阴", "少阳", "少阴"] },
    });
    expect(r.lines).toEqual([
      LineType.SHAO_YANG,
      LineType.SHAO_YIN,
      LineType.LAO_YANG,
      LineType.LAO_YIN,
      LineType.SHAO_YANG,
      LineType.SHAO_YIN,
    ]);
  });

  test("parses time.gregorian", () => {
    const r = normalizeLiuyaoAiPrefill({ time: { gregorian: { date: "2026-01-27", time: "18:28", timezone: "UTC+8" } } });
    expect(r.time?.timeHHmm).toBe("18:28");
  });
});

