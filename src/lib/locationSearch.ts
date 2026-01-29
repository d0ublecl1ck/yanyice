export type LocationNode = { id: string; name: string };

export type LocationHierarchy = {
  level1: LocationNode[];
  level2By1: Record<string, LocationNode[]>;
  level3By2: Record<string, LocationNode[]>;
};

const normalizeQuery = (query: string) => query.trim().toLowerCase();

export const includesQuery = (value: string, query: string) => {
  const q = normalizeQuery(query);
  if (!q) return true;
  return value.toLowerCase().includes(q);
};

export const filterProvinces = (data: LocationHierarchy, query: string) => {
  const q = normalizeQuery(query);
  if (!q) return data.level1;

  return data.level1.filter((level1) => {
    if (includesQuery(level1.name, q)) return true;

    const level2 = data.level2By1[level1.id] ?? [];
    for (const l2 of level2) {
      if (includesQuery(l2.name, q)) return true;
      const level3 = data.level3By2[l2.id] ?? [];
      if (level3.some((l3) => includesQuery(l3.name, q))) return true;
    }

    return false;
  });
};

export const filterCities = (data: LocationHierarchy, level1Id: string, query: string) => {
  const base = data.level2By1[level1Id] ?? [];
  const q = normalizeQuery(query);
  if (!q) return base;

  return base.filter((l2) => {
    if (includesQuery(l2.name, q)) return true;
    const level3 = data.level3By2[l2.id] ?? [];
    return level3.some((l3) => includesQuery(l3.name, q));
  });
};

export const filterDistricts = (data: LocationHierarchy, level2Id: string, query: string) => {
  const base = data.level3By2[level2Id] ?? [];
  const q = normalizeQuery(query);
  if (!q) return base;
  return base.filter((l3) => includesQuery(l3.name, q));
};
