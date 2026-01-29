import { describe, expect, test } from "bun:test";

import { getSelectTriggerClassName } from "@/components/Select";

describe("Select", () => {
  test("getSelectTriggerClassName uses underline variant by default", () => {
    const cn = getSelectTriggerClassName({});
    expect(cn).toContain("border-b");
    expect(cn).toContain("rounded-none");
  });

  test("getSelectTriggerClassName supports box + center + sm", () => {
    const cn = getSelectTriggerClassName({ variant: "box", align: "center", size: "sm" });
    expect(cn).toContain("border");
    expect(cn).toContain("rounded-[2px]");
    expect(cn).toContain("text-center");
    expect(cn).toContain("text-[10px]");
  });
});
