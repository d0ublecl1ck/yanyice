import { describe, expect, test } from "bun:test";

import { parseLiuyaoIsoFromText } from "../src/liuyao/recognitionTime";

describe("server liuyao recognition time parsing", () => {
  test("parses Chinese datetime with lunar annotation", () => {
    const iso = parseLiuyaoIsoFromText("前任有挽留的意思…2026年01月27日18:28（十二月初九）");
    expect(iso).toBeTruthy();
    if (!iso) return;

    const d = new Date(iso);
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth() + 1).toBe(1);
    expect(d.getDate()).toBe(27);
    expect(d.getHours()).toBe(18);
    expect(d.getMinutes()).toBe(28);
  });
});

