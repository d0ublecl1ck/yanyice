import { describe, expect, test } from "bun:test";

import { newCaseHref, recordAnalysisHref, recordEditHref, rulesHref } from "../caseLinks";

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

  test("recordAnalysisHref routes by module and encodes id", () => {
    expect(recordAnalysisHref("liuyao", "abc")).toBe("/liuyao/analysis/abc");
    expect(recordAnalysisHref("bazi", "abc")).toBe("/bazi/analysis/abc");
    expect(recordAnalysisHref("bazi", "a/b")).toBe("/bazi/analysis/a%2Fb");
  });

  test("newCaseHref routes by module", () => {
    expect(newCaseHref("liuyao")).toBe("/cases?create=liuyao");
    expect(newCaseHref("bazi")).toBe("/bazi/new");
  });

  test("newCaseHref appends customerId when provided", () => {
    expect(newCaseHref("liuyao", { customerId: "123" })).toBe("/cases?create=liuyao&customerId=123");
    expect(newCaseHref("liuyao", { customerId: "   " })).toBe("/cases?create=liuyao");
    expect(newCaseHref("bazi", { customerId: "a/b" })).toBe("/bazi/new?customerId=a%2Fb");
    expect(newCaseHref("bazi", { customerId: "   " })).toBe("/bazi/new");
  });
});
