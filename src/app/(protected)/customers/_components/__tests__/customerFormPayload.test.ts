import { describe, expect, test } from "bun:test";

import { buildCreateCustomerPayload, buildUpdateCustomerPayload } from "../customerFormPayload";

describe("customer form payload", () => {
  test("create payload includes gender and omits birth fields", () => {
    const payload = buildCreateCustomerPayload({
      name: "张三",
      gender: "male",
      birthDate: "2026-01-01",
      birthTime: "10:00",
      phone: "123",
      notes: "",
      tags: [],
    });

    expect(payload.gender).toBe("male");
    expect("birthDate" in payload).toBe(false);
    expect("birthTime" in payload).toBe(false);
  });

  test("update payload includes gender and birth fields", () => {
    const payload = buildUpdateCustomerPayload({
      name: "张三",
      gender: "male",
      birthDate: "2026-01-01",
      birthTime: "10:00",
      phone: "123",
      notes: "",
      tags: [],
    });

    expect(payload.gender).toBe("male");
    expect(payload.birthDate).toBe("2026-01-01");
    expect(payload.birthTime).toBe("10:00");
  });
});
