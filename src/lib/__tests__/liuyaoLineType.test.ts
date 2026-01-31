import { describe, expect, test } from "bun:test";

import { LineType } from "@/lib/types";
import { getLineNature, getMovingMarkText, isLineMoving, toLineType } from "@/lib/liuyao/lineType";

describe("liuyao lineType helpers", () => {
  test("nature mapping", () => {
    expect(getLineNature(LineType.SHAO_YANG)).toBe("yang");
    expect(getLineNature(LineType.LAO_YANG)).toBe("yang");
    expect(getLineNature(LineType.SHAO_YIN)).toBe("yin");
    expect(getLineNature(LineType.LAO_YIN)).toBe("yin");
  });

  test("moving mapping", () => {
    expect(isLineMoving(LineType.SHAO_YANG)).toBe(false);
    expect(isLineMoving(LineType.SHAO_YIN)).toBe(false);
    expect(isLineMoving(LineType.LAO_YANG)).toBe(true);
    expect(isLineMoving(LineType.LAO_YIN)).toBe(true);
  });

  test("toLineType", () => {
    expect(toLineType("yang", false)).toBe(LineType.SHAO_YANG);
    expect(toLineType("yang", true)).toBe(LineType.LAO_YANG);
    expect(toLineType("yin", false)).toBe(LineType.SHAO_YIN);
    expect(toLineType("yin", true)).toBe(LineType.LAO_YIN);
  });

  test("moving mark text", () => {
    expect(getMovingMarkText(LineType.SHAO_YANG)).toBe("");
    expect(getMovingMarkText(LineType.SHAO_YIN)).toBe("");
    expect(getMovingMarkText(LineType.LAO_YANG)).toBe("○");
    expect(getMovingMarkText(LineType.LAO_YIN)).toBe("×");
  });
});

