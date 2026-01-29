import { describe, expect, test } from "bun:test";

import { getSelectClassName } from "@/components/Select";

describe("Select", () => {
  test("getSelectClassName uses underline variant by default", () => {
    const cn = getSelectClassName({});
    expect(cn).toContain("border-b");
    expect(cn).toContain("rounded-none");
  });

  test("getSelectClassName supports box + center + sm", () => {
    const cn = getSelectClassName({ variant: "box", align: "center", size: "sm" });
    expect(cn).toContain("border");
    expect(cn).toContain("rounded-[2px]");
    expect(cn).toContain("text-center");
    expect(cn).toContain("text-[10px]");
  });
});

