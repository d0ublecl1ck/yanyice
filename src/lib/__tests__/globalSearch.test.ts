import { describe, expect, test } from "bun:test";

import { searchCustomers, searchRecords } from "../globalSearch";

describe("globalSearch", () => {
  test("searchCustomers matches tags / customFields / phone digits", () => {
    const customers = [
      {
        id: "c1",
        name: "张三",
        gender: "male",
        birthDate: "1990-01-01",
        birthTime: "08:00",
        phone: "138-0013-8000",
        tags: ["重要客户", "VIP"],
        notes: "老客户",
        customFields: { 公司: "开元", 城市: "上海" },
        createdAt: 1,
      },
      {
        id: "c2",
        name: "李四",
        gender: "female",
        tags: ["普通"],
        notes: "",
        customFields: {},
        createdAt: 2,
      },
    ] as const;

    expect(searchCustomers([...customers], "重要", 10).map((c) => c.id)).toEqual(["c1"]);
    expect(searchCustomers([...customers], "#vip", 10).map((c) => c.id)).toEqual(["c1"]);
    expect(searchCustomers([...customers], "开元", 10).map((c) => c.id)).toEqual(["c1"]);
    expect(searchCustomers([...customers], "001380", 10).map((c) => c.id)).toEqual(["c1"]);
  });

  test("searchRecords matches tags / module fields and ignores ids", () => {
    const records = [
      {
        id: "r1",
        customerId: "c1",
        customerName: "张三",
        module: "liuyao",
        subject: "求职",
        notes: "问事业发展",
        tags: ["事业"],
        liuyaoData: { lines: [0, 0, 0, 0, 0, 0], date: "2026-01-01", subject: "求职", monthBranch: "寅", dayBranch: "子" },
        verifiedStatus: "unverified",
        verifiedNotes: "",
        pinnedAt: null,
        createdAt: 1,
      },
      {
        id: "r2",
        customerId: "c2",
        customerName: "李四",
        module: "bazi",
        subject: "婚姻",
        notes: "看缘分",
        tags: ["感情"],
        baziData: {
          yearStem: "甲",
          yearBranch: "子",
          monthStem: "乙",
          monthBranch: "丑",
          dayStem: "丙",
          dayBranch: "寅",
          hourStem: "丁",
          hourBranch: "卯",
          birthDate: "1992-02-02",
          location: "北京",
          category: "婚恋",
        },
        verifiedStatus: "unverified",
        verifiedNotes: "",
        pinnedAt: null,
        createdAt: 2,
      },
    ] as const;

    expect(searchRecords([...records], "事业", 10).map((r) => r.id)).toEqual(["r1"]);
    expect(searchRecords([...records], "寅", 10).map((r) => r.id)).toEqual(["r1", "r2"]);
    expect(searchRecords([...records], "甲子", 10).map((r) => r.id)).toEqual(["r2"]);

    expect(searchRecords([...records], "张三 事业", 10).map((r) => r.id)).toEqual(["r1"]);

    expect(searchRecords([...records], "r1", 10)).toEqual([]);
  });
});

