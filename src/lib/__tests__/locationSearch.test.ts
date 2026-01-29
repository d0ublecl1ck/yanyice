import { describe, expect, test } from "bun:test";

import { filterCities, filterDistricts, filterProvinces, type LocationData } from "@/lib/locationSearch";

const data: LocationData = {
  provinces: ["北京市", "四川省"],
  citiesByProvince: { 北京市: ["北京市"], 四川省: ["成都市", "绵阳市"] },
  districtsByCity: { 成都市: ["锦江区", "青羊区"], 绵阳市: ["涪城区"] },
};

describe("locationSearch", () => {
  test("empty query returns base lists", () => {
    expect(filterProvinces(data, "")).toEqual(["北京市", "四川省"]);
    expect(filterCities(data, "四川省", "")).toEqual(["成都市", "绵阳市"]);
    expect(filterDistricts(data, "成都市", "")).toEqual(["锦江区", "青羊区"]);
  });

  test("query matches a city", () => {
    expect(filterProvinces(data, "成都")).toEqual(["四川省"]);
    expect(filterCities(data, "四川省", "成都")).toEqual(["成都市"]);
  });

  test("query matches a district and bubbles up", () => {
    expect(filterProvinces(data, "锦江")).toEqual(["四川省"]);
    expect(filterCities(data, "四川省", "锦江")).toEqual(["成都市"]);
    expect(filterDistricts(data, "成都市", "锦江")).toEqual(["锦江区"]);
  });
});

