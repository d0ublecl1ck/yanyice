import { describe, expect, test } from "bun:test";

import { filterCities, filterDistricts, filterProvinces, type LocationHierarchy } from "@/lib/locationSearch";

const data: LocationHierarchy = {
  level1: [
    { id: "p1", name: "北京市" },
    { id: "p2", name: "四川省" },
  ],
  level2By1: {
    p1: [{ id: "c1", name: "北京市" }],
    p2: [
      { id: "c2", name: "成都市" },
      { id: "c3", name: "绵阳市" },
    ],
  },
  level3By2: {
    c2: [
      { id: "d1", name: "锦江区" },
      { id: "d2", name: "青羊区" },
    ],
    c3: [{ id: "d3", name: "涪城区" }],
  },
};

describe("locationSearch", () => {
  test("empty query returns base lists", () => {
    expect(filterProvinces(data, "").map((n) => n.name)).toEqual(["北京市", "四川省"]);
    expect(filterCities(data, "p2", "").map((n) => n.name)).toEqual(["成都市", "绵阳市"]);
    expect(filterDistricts(data, "c2", "").map((n) => n.name)).toEqual(["锦江区", "青羊区"]);
  });

  test("query matches a city", () => {
    expect(filterProvinces(data, "成都").map((n) => n.name)).toEqual(["四川省"]);
    expect(filterCities(data, "p2", "成都").map((n) => n.name)).toEqual(["成都市"]);
  });

  test("query matches a district and bubbles up", () => {
    expect(filterProvinces(data, "锦江").map((n) => n.name)).toEqual(["四川省"]);
    expect(filterCities(data, "p2", "锦江").map((n) => n.name)).toEqual(["成都市"]);
    expect(filterDistricts(data, "c2", "锦江").map((n) => n.name)).toEqual(["锦江区"]);
  });
});
