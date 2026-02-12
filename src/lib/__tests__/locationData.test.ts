import { describe, expect, test } from "bun:test";

import { loadLocationPickerSchema } from "@/lib/locationData";

describe("locationData", () => {
  test("loads domestic schema with Beijing", async () => {
    const schema = await loadLocationPickerSchema("domestic");
    expect(schema.labels.level1).toBe("省份");
    expect(schema.hierarchy.level1.some((n) => n.id === "110000" && n.name.includes("北京"))).toBe(true);
  });

  test("loads overseas schema with US", async () => {
    const schema = await loadLocationPickerSchema("overseas");
    expect(schema.labels.level1).toBe("国家");
    expect(schema.hierarchy.level1.some((n) => n.id === "US" && n.name.toLowerCase().includes("united"))).toBe(true);
  });
});

