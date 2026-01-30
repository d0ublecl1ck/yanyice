import { describe, expect, test } from "bun:test";

import { calcMingJuRelations } from "../baziRelations";

describe("baziRelations", () => {
  test("calculates mingju relations like sample output", () => {
    const { tianGan, diZhi } = calcMingJuRelations({
      stems: ["乙", "己", "甲", "丙"],
      branches: ["酉", "丑", "寅", "戌"],
    });

    expect(tianGan).toContain("乙己相克");
    expect(diZhi).toEqual(["酉丑半合金局", "寅戌拱合午", "丑寅暗合", "丑戌相刑", "酉戌相害"]);
  });

  test("dedupes repeated relations", () => {
    const { tianGan, diZhi } = calcMingJuRelations({
      stems: ["乙", "己", "乙", "己"],
      branches: ["丑", "寅", "丑", "寅"],
    });

    expect(tianGan).toEqual(["乙己相克"]);
    expect(diZhi).toEqual(["丑寅暗合"]);
  });

  test("shows liuhe as 合", () => {
    const { diZhi } = calcMingJuRelations({
      stems: [],
      branches: ["子", "丑"],
    });

    expect(diZhi).toEqual(["子丑合"]);
  });
});
