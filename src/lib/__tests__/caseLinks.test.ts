import { describe, expect, test } from "bun:test";

import { newCaseHref, recordEditHref, rulesHref } from "../caseLinks";

describe("caseLinks", () => {
  test("rulesHref routes by module", () => {
    expect(rulesHref("liuyao")).toBe("/liuyao/rules");
    expect(rulesHref("bazi")).toBe("/bazi/rules");
  });

  test("recordEditHref routes by module and encodes id", () => {
    expect(recordEditHref("liuyao", "abc")).toBe("/liuyao/edit/abc");
    expect(recordEditHref("bazi", "abc")).toBe("/bazi/edit/abc");
    expect(recordEditHref("liuyao", "a/b")).toBe("/liuyao/edit/a%2Fb");
  });

  test("newCaseHref routes by module", () => {
    expect(newCaseHref("liuyao")).toBe("/liuyao/new");
    expect(newCaseHref("bazi")).toBe("/bazi/new");
  });
});
