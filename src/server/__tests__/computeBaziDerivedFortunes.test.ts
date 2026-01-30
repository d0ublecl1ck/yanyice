import { describe, expect, test } from "bun:test";

import { computeBaziFromBirthDate } from "../../../server/src/bazi/computeBazi";

describe("computeBaziFromBirthDate fortunes", () => {
  test("includes decade -> years -> months breakdown", () => {
    const computed = computeBaziFromBirthDate({
      birthDate: "1990-01-15 12:00:00",
      gender: 1,
      eightCharProviderSect: 2,
    });

    const decades = computed.derived.decadeFortune.list;
    expect(decades.length).toBe(10);

    for (const d of decades) {
      expect(d.startYear).toBeTypeOf("number");
      expect(d.endYear).toBeTypeOf("number");
      expect(d.years.length).toBe(d.endYear - d.startYear + 1);

      for (const y of d.years) {
        expect(y.year).toBeTypeOf("number");
        expect(y.gz).toBeTypeOf("string");
        expect(y.months.length).toBe(12);
      }
    }
  });

  test("month fortunes align to jie terms starting at lichun", () => {
    const computed = computeBaziFromBirthDate({
      birthDate: "1990-01-15 12:00:00",
      gender: 1,
      eightCharProviderSect: 2,
    });

    const firstYear = computed.derived.decadeFortune.list[0]?.years[0];
    expect(firstYear).toBeTruthy();
    if (!firstYear) return;

    const firstMonth = firstYear.months[0];
    expect(firstMonth.termName).toBe("立春");
    expect(firstMonth.gz).toBeTypeOf("string");
    expect(firstMonth.termDate).toMatch(/^\d{1,2}\/\d{1,2}$/);

    const lastMonth = firstYear.months[11];
    expect(lastMonth.termName).toBe("小寒");
    expect(lastMonth.termDate).toMatch(/^\d{1,2}\/\d{1,2}$/);
  });
});

