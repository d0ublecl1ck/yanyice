import { describe, expect, test } from "bun:test";
import { daysInMonth, firstDayOfMonth } from "../ChineseDatePicker";

describe("ChineseDatePicker date helpers", () => {
  test("daysInMonth handles leap years", () => {
    expect(daysInMonth(2024, 1)).toBe(29);
    expect(daysInMonth(2023, 1)).toBe(28);
  });

  test("daysInMonth handles 31-day months", () => {
    expect(daysInMonth(2025, 11)).toBe(31);
  });

  test("firstDayOfMonth returns correct weekday index", () => {
    // Jan 1, 2024 was Monday (1)
    expect(firstDayOfMonth(2024, 0)).toBe(1);
    // Mar 1, 2020 was Sunday (0)
    expect(firstDayOfMonth(2020, 2)).toBe(0);
  });
});
