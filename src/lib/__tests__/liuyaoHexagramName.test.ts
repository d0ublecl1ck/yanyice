import { describe, expect, test } from "bun:test";

import { deriveLinesFromHexagramNames } from "@/lib/liuyao/hexagramName";
import { LineType } from "@/lib/types";

describe("liuyao hexagramName", () => {
  test("derives moving lines from base/changed hexagrams", () => {
    // 地水师 (坤上坎下) -> 天地否 (乾上坤下)
    // bottom-to-top: [阴,阳,阴,阴,阴,阴] -> [阴,阴,阴,阳,阳,阳]
    // moving: 2爻(阳->阴)=老阳动; 4/5/6爻(阴->阳)=老阴动
    expect(deriveLinesFromHexagramNames("地水师", "天地否")).toEqual([
      LineType.SHAO_YIN,
      LineType.LAO_YANG,
      LineType.SHAO_YIN,
      LineType.LAO_YIN,
      LineType.LAO_YIN,
      LineType.LAO_YIN,
    ]);
  });
});

