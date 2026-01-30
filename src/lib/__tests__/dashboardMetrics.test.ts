import { describe, expect, test } from "bun:test";

import { getDashboardCounts } from "../dashboardMetrics";

describe("dashboardMetrics", () => {
  test("getDashboardCounts returns card counts", () => {
    const customers = [
      { id: "c1", name: "张三", gender: "male", tags: [], notes: "", customFields: {}, createdAt: 1 },
      { id: "c2", name: "李四", gender: "female", tags: [], notes: "", customFields: {}, createdAt: 2 },
    ] as const;

    const records = [
      {
        id: "r1",
        customerId: "c1",
        module: "bazi",
        subject: "八字-1",
        notes: "",
        tags: [],
        verifiedStatus: "unverified",
        verifiedNotes: "",
        pinnedAt: null,
        createdAt: 1,
      },
      {
        id: "r2",
        customerId: "c1",
        module: "liuyao",
        subject: "六爻-1",
        notes: "",
        tags: [],
        verifiedStatus: "unverified",
        verifiedNotes: "",
        pinnedAt: null,
        createdAt: 2,
      },
      {
        id: "r3",
        customerId: "c2",
        module: "bazi",
        subject: "八字-2",
        notes: "",
        tags: [],
        verifiedStatus: "unverified",
        verifiedNotes: "",
        pinnedAt: null,
        createdAt: 3,
      },
    ] as const;

    const rules = [{ id: "rule1", module: "bazi", name: "R", enabled: true, condition: "", message: "" }];

    const res = getDashboardCounts({
      customers: [...customers],
      records: [...records],
      rules,
    });

    expect(res).toEqual({
      customers: 2,
      records: 3,
      baziRecords: 2,
      liuyaoRecords: 1,
      rules: 1,
    });
  });
});
