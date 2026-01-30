import { describe, expect, test } from "bun:test";
import { SolarTime } from "tyme4ts";

import {
  BAZI_PICKER_YEAR_END,
  BAZI_PICKER_YEAR_START,
  deriveBaziPickerFromSolar,
  deriveBaziPickerFromSolarTime,
  getBaziPickerYearItems,
  getBaziTimePickerOpenDefaults,
  getNowButtonResult,
  parseQuickFourPillarsInput,
  parseQuickSolarInput,
  tryDeriveSolarFromLunar,
} from "../baziTimePicker";

describe("baziTimePicker helpers", () => {
  test("year items cover 1900-2099", () => {
    const years = getBaziPickerYearItems();
    expect(years[0]).toBe(BAZI_PICKER_YEAR_START);
    expect(years[years.length - 1]).toBe(BAZI_PICKER_YEAR_END);
    expect(years).toContain(2026);
  });

  test("getNowButtonResult does not auto confirm/close", () => {
    const result = getNowButtonResult(new Date(2024, 0, 2, 3, 4, 5));
    expect(result.shouldAutoConfirm).toBe(false);
    expect(result.shouldAutoClose).toBe(false);
  });

  test("getBaziTimePickerOpenDefaults uses solar tab and now time", () => {
    const defaults = getBaziTimePickerOpenDefaults(new Date(2024, 0, 2, 3, 4, 5));
    expect(defaults.tab).toBe("solar");
    expect(defaults.derived.solar).toEqual({ y: 2024, m: 1, d: 2, h: 3, min: 4 });
  });

  test("getNowButtonResult uses provided local time for solar fields", () => {
    const now = new Date(2024, 0, 2, 3, 4, 5);
    const { derived } = getNowButtonResult(now);
    expect(derived.solar).toEqual({ y: 2024, m: 1, d: 2, h: 3, min: 4 });
  });

  test("deriveBaziPickerFromSolarTime parses SolarTime into picker shape", () => {
    const st = SolarTime.fromYmdHms(2024, 1, 2, 3, 4, 0);
    const derived = deriveBaziPickerFromSolarTime(st);
    expect(derived.solar).toEqual({ y: 2024, m: 1, d: 2, h: 3, min: 4 });
  });

  test("deriveBaziPickerFromSolar matches deriveBaziPickerFromSolarTime", () => {
    const solar = { y: 2024, m: 1, d: 2, h: 3, min: 4 };
    const a = deriveBaziPickerFromSolar(solar);
    const b = deriveBaziPickerFromSolarTime(SolarTime.fromYmdHms(2024, 1, 2, 3, 4, 0));
    expect(a).toEqual(b);
  });

  test("tryDeriveSolarFromLunar roundtrips through tyme4ts", () => {
    const solar = { y: 2024, m: 6, d: 18, h: 9, min: 8 };
    const derived = deriveBaziPickerFromSolar(solar);
    const back = tryDeriveSolarFromLunar(derived.lunar);
    expect(back).toEqual(solar);
  });

  test("parseQuickSolarInput parses YYYYMMDDHHmm", () => {
    expect(parseQuickSolarInput("199303270255")).toEqual({ y: 1993, m: 3, d: 27, h: 2, min: 55 });
  });

  test("parseQuickSolarInput parses YYYYMMDD and fills time as 00:00", () => {
    expect(parseQuickSolarInput("19930327")).toEqual({ y: 1993, m: 3, d: 27, h: 0, min: 0 });
  });

  test("parseQuickSolarInput rejects invalid dates", () => {
    expect(parseQuickSolarInput("202302300000")).toBeNull();
    expect(parseQuickSolarInput("209913010000")).toBeNull();
  });

  test("parseQuickFourPillarsInput parses 8-char pillars", () => {
    expect(parseQuickFourPillarsInput("乙酉戊寅丙戌己丑")).toEqual({
      yS: "乙",
      yB: "酉",
      mS: "戊",
      mB: "寅",
      dS: "丙",
      dB: "戌",
      hS: "己",
      hB: "丑",
    });
  });

  test("parseQuickFourPillarsInput tolerates whitespace", () => {
    expect(parseQuickFourPillarsInput("乙酉 戊寅 丙戌 己丑")).toEqual({
      yS: "乙",
      yB: "酉",
      mS: "戊",
      mB: "寅",
      dS: "丙",
      dB: "戌",
      hS: "己",
      hB: "丑",
    });
  });

  test("parseQuickFourPillarsInput rejects invalid chars", () => {
    expect(parseQuickFourPillarsInput("乙酉戊寅丙戌己X")).toBeNull();
  });
});
