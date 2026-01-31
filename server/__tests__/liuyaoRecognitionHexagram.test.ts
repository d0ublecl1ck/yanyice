import { describe, expect, test } from "bun:test";

import { deriveLinesFromHexagramNames, parseHexagramPairFromText } from "../src/liuyao/recognitionHexagram";

describe("liuyao hexagram recognition", () => {
  test("parses text like 地水师变天地否", () => {
    const parsed = parseHexagramPairFromText("地水师变天地否");
    expect(parsed).toEqual({ baseHexagramName: "地水师", changedHexagramName: "天地否" });
  });

  test("derives moving lines from base/changed hexagrams", () => {
    // 地水师 (坤上坎下) -> 天地否 (乾上坤下)
    // bottom-to-top: [阴,阳,阴,阴,阴,阴] -> [阴,阴,阴,阳,阳,阳]
    // moving: 2爻(阳->阴)=老阳动; 4/5/6爻(阴->阳)=老阴动
    expect(deriveLinesFromHexagramNames("地水师", "天地否")).toEqual([1, 2, 1, 3, 3, 3]);
  });
});

