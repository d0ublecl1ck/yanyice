import { describe, expect, test } from "bun:test";

import { paipanLiuyao } from "@/lib/liuyao/paipan";
import { LineType, type LiuYaoData } from "@/lib/types";

describe("liuyao paipan", () => {
  test("builds base/changed hexagram, palace, najia, six gods", () => {
    const data: LiuYaoData = {
      lines: [
        LineType.SHAO_YANG,
        LineType.LAO_YANG,
        LineType.SHAO_YIN,
        LineType.SHAO_YANG,
        LineType.SHAO_YIN,
        LineType.SHAO_YANG,
      ],
      date: "2026-01-01T12:00:00",
      subject: "测试",
      monthBranch: "子",
      dayBranch: "甲子",
    };

    const p = paipanLiuyao(data);

    expect(p.base.name).toBe("火泽睽");
    expect(p.changed.name).toBe("火雷噬嗑");

    expect(p.palace.name).toBe("艮");
    expect(p.palace.generation).toBe("四世");
    expect(p.palace.shiLineIndexFromBottom).toBe(3);
    expect(p.palace.yingLineIndexFromBottom).toBe(0);

    expect(p.lines[0]?.najia.text).toBe("丁巳");
    expect(p.lines[1]?.najia.text).toBe("丁卯");
    expect(p.lines[2]?.najia.text).toBe("丁丑");
    expect(p.lines[3]?.najia.text).toBe("己酉");
    expect(p.lines[4]?.najia.text).toBe("己未");
    expect(p.lines[5]?.najia.text).toBe("己巳");

    expect(p.lines[0]?.sixGod).toBe("青龙");
    expect(p.lines[1]?.sixGod).toBe("朱雀");

    expect(p.lines[0]?.relative).toBe("父母");
    expect(p.lines[3]?.relative).toBe("子孙");

    expect(p.lines[0]?.isYing).toBe(true);
    expect(p.lines[3]?.isShi).toBe(true);
  });
});

