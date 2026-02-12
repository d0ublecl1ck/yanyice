import { describe, expect, test } from "bun:test";

import { getLiuyaoLineSvgModel } from "@/components/liuyao/LiuyaoLineSvg";
import { LineType } from "@/lib/types";

describe("LiuyaoLineSvg model", () => {
  test("yang/yin segments and moving marks", () => {
    expect(getLiuyaoLineSvgModel(LineType.SHAO_YANG)).toEqual({
      segments: [{ x: 0, width: 120 }],
      mark: null,
    });

    expect(getLiuyaoLineSvgModel(LineType.SHAO_YIN)).toEqual({
      segments: [
        { x: 0, width: 48 },
        { x: 72, width: 48 },
      ],
      mark: null,
    });

    expect(getLiuyaoLineSvgModel(LineType.LAO_YANG).mark).toBe("O");
    expect(getLiuyaoLineSvgModel(LineType.LAO_YIN).mark).toBe("X");
  });
});

