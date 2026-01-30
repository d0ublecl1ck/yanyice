import { describe, expect, test } from "bun:test";

import { calcLiuyaoShenSha } from "@/lib/liuyao/shenSha";

describe("liuyao shensha", () => {
  test("computes shensha from divination time", () => {
    const sha = calcLiuyaoShenSha({ dayStem: "乙", dayBranch: "亥", monthBranch: "子" });

    expect(sha.items).toEqual([
      { name: "贵人", branch: "子申" },
      { name: "禄神", branch: "卯" },
      { name: "羊刃", branch: "寅" },
      { name: "文昌", branch: "午" },
      { name: "驿马", branch: "巳" },
      { name: "桃花", branch: "子" },
      { name: "将星", branch: "卯" },
      { name: "劫煞", branch: "申" },
      { name: "华盖", branch: "未" },
      { name: "谋星", branch: "丑" },
      { name: "灾煞", branch: "酉" },
      { name: "天医", branch: "亥" },
      { name: "天喜", branch: "未" },
    ]);
  });
});
