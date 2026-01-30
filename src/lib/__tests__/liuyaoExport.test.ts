import { describe, expect, test } from "bun:test";

import { paipanLiuyao } from "@/lib/liuyao/paipan";
import { formatLiuyaoExportText } from "@/lib/liuyao/export";
import { LineType, type LiuYaoData } from "@/lib/types";

describe("liuyao export", () => {
  test("formats a readable export text", () => {
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

    const text = formatLiuyaoExportText({
      id: "cml0qya9f00002gronvm2bcy6",
      subject: "测试卦例",
      customerName: "张三",
      solarDate: "2026/1/1 12:00:00",
      monthBranch: "子",
      dayBranch: "甲子",
      paipan: paipanLiuyao(data),
      shenSha: { items: [{ name: "天乙", branch: "子" }] },
      chatHistory: [
        { role: "user", text: "你好" },
        { role: "model", text: "我来推演" },
      ],
    });

    expect(text).toContain("一、 基础信息");
    expect(text).toContain("- 占事：测试卦例");

    expect(text).toContain("二、 卦象结构");
    expect(text).toContain("- 本卦：火泽睽（艮宫）");
    expect(text).toContain("- 变卦：火雷噬嗑（巽宫）");

    expect(text).toContain("三、 六神与爻位详解");
    expect(text).toContain("1. 本卦：火泽睽（艮宫）");
    expect(text).toContain("2. 变卦：火雷噬嗑（巽宫）");
    expect(text).toContain("| 六神 | 爻位 | 六亲 | 地支 | 状态 | 位置 |");
    expect(text).toContain("| --- | --- | --- | --- | --- | --- |");

    expect(text).toContain("- 神煞：天乙在子");

    expect(text).toContain("四、 对话记录");
    expect(text).toContain("| 角色 | 内容 |");
    expect(text).toContain("我");
    expect(text).toContain("你好");
    expect(text).toContain("助手");
    expect(text).toContain("我来推演");
  });
});
