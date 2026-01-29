import { describe, expect, test } from "bun:test";

import { rulesPathForModule } from "../rulesRoutes";

describe("rulesRoutes", () => {
  test("rulesPathForModule returns per-module rules path", () => {
    expect(rulesPathForModule("liuyao")).toBe("/liuyao/rules");
    expect(rulesPathForModule("bazi")).toBe("/bazi/rules");
  });
});

