export type LocationData = {
  provinces: string[];
  citiesByProvince: Record<string, string[]>;
  districtsByCity: Record<string, string[]>;
};

const normalizeQuery = (query: string) => query.trim().toLowerCase();

export const includesQuery = (value: string, query: string) => {
  const q = normalizeQuery(query);
  if (!q) return true;
  return value.toLowerCase().includes(q);
};

export const filterProvinces = (data: LocationData, query: string) => {
  const q = normalizeQuery(query);
  if (!q) return data.provinces;

  return data.provinces.filter((province) => {
    if (includesQuery(province, q)) return true;

    const cities = data.citiesByProvince[province] ?? [];
    for (const city of cities) {
      if (includesQuery(city, q)) return true;
      const districts = data.districtsByCity[city] ?? [];
      if (districts.some((d) => includesQuery(d, q))) return true;
    }

    return false;
  });
};

export const filterCities = (data: LocationData, province: string, query: string) => {
  const base = data.citiesByProvince[province] ?? [];
  const q = normalizeQuery(query);
  if (!q) return base;

  return base.filter((city) => {
    if (includesQuery(city, q)) return true;
    const districts = data.districtsByCity[city] ?? [];
    return districts.some((d) => includesQuery(d, q));
  });
};

export const filterDistricts = (data: LocationData, city: string, query: string) => {
  const base = data.districtsByCity[city] ?? [];
  const q = normalizeQuery(query);
  if (!q) return base;
  return base.filter((district) => includesQuery(district, q));
};

