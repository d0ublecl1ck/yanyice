import { describe, expect, test } from "bun:test";

import { zodiacInfoFromBranch } from "../zodiac";

describe("zodiac", () => {
  test("maps earthly branch to zodiac info", () => {
    expect(zodiacInfoFromBranch("酉")).toEqual({
      key: "rooster",
      nameCn: "鸡",
      iconSrc: "/icons/zodiac/rooster.svg",
    });
    expect(zodiacInfoFromBranch("子")?.key).toBe("rat");
    expect(zodiacInfoFromBranch("亥")?.key).toBe("pig");
  });

  test("handles common input variants", () => {
    expect(zodiacInfoFromBranch(" 酉 ")?.key).toBe("rooster");
  });

  test("returns null for empty or unknown branch", () => {
    expect(zodiacInfoFromBranch("")).toBeNull();
    expect(zodiacInfoFromBranch("甲")).toBeNull();
    expect(zodiacInfoFromBranch("西")).toBeNull();
    expect(zodiacInfoFromBranch(undefined)).toBeNull();
  });
});
