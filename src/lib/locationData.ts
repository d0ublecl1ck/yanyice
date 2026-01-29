import type { LocationHierarchy, LocationNode } from "@/lib/locationSearch";

export type RegionType = "domestic" | "overseas";

export type LocationPickerSchema = {
  labels: { level1: string; level2: string; level3: string };
  hierarchy: LocationHierarchy;
};

const byId = (a: LocationNode, b: LocationNode) => a.id.localeCompare(b.id, "en");

type ImportWithDefault<T> = { default: T };

const normalizeImport = <T,>(mod: unknown): T => {
  if (mod && typeof mod === "object" && "default" in mod) {
    return (mod as ImportWithDefault<T>).default;
  }
  return mod as T;
};

type CSCountry = { name: string; isoCode: string };
type CSState = { name: string; isoCode: string; countryCode: string };
type CSCity = { name: string };

type CountryApi = { getAllCountries: () => CSCountry[] };
type StateApi = { getStatesOfCountry: (countryCode: string) => CSState[] };
type CityApi = {
  getCitiesOfCountry: (countryCode: string) => CSCity[];
  getCitiesOfState: (countryCode: string, stateCode: string) => CSCity[];
};

type CountryStateCity = { Country: CountryApi; State: StateApi; City: CityApi };

const buildChinaHierarchy = async (): Promise<LocationPickerSchema> => {
  const mod = await import("china-area-data");
  const china = normalizeImport<Record<string, Record<string, string>>>(mod);

  const provinceObj = china["86"] ?? {};
  const provinces: LocationNode[] = Object.entries(provinceObj)
    .map(([id, name]) => ({ id, name }))
    .sort(byId);

  const level2By1: Record<string, LocationNode[]> = {};
  const level3By2: Record<string, LocationNode[]> = {};

  for (const p of provinces) {
    const citiesObj = china[p.id] ?? {};
    const cityEntries = Object.entries(citiesObj);

    const cities: LocationNode[] = cityEntries
      .map(([id, name]) => ({ id, name }))
      .sort(byId);

    // 直辖市/省直辖县级行政区等通常只有一个“市辖区/县”，这里展示为省份名更直观
    if (cities.length === 1 && (cities[0]?.name === "市辖区" || cities[0]?.name === "县")) {
      cities[0] = { ...cities[0], name: p.name };
    }

    level2By1[p.id] = cities;

    for (const c of cities) {
      const districtsObj = china[c.id] ?? {};
      const districts: LocationNode[] = Object.entries(districtsObj)
        .map(([id, name]) => ({ id, name }))
        .sort(byId);
      level3By2[c.id] = districts;
    }
  }

  return {
    labels: { level1: "省份", level2: "城市", level3: "区县" },
    hierarchy: { level1: provinces, level2By1, level3By2 },
  };
};

const buildWorldHierarchy = async (): Promise<LocationPickerSchema> => {
  const mod = await import("country-state-city");
  const csc = normalizeImport<CountryStateCity>(mod);

  const countriesRaw = csc.Country.getAllCountries();
  const countries: LocationNode[] = countriesRaw
    .map((c) => ({ id: c.isoCode, name: c.name }))
    .sort((a, b) => a.name.localeCompare(b.name, "en"));

  const level2By1: Record<string, LocationNode[]> = {};
  const level3By2: Record<string, LocationNode[]> = {};

  for (const country of countries) {
    const statesRaw = csc.State.getStatesOfCountry(country.id);

    const states: LocationNode[] = statesRaw
      .map((s) => ({ id: `${s.countryCode}-${s.isoCode}`, name: s.name }))
      .sort((a, b) => a.name.localeCompare(b.name, "en"));

    // 某些国家没有州/省：用一个占位层，把城市挂到 level3
    if (states.length === 0) {
      const pseudo = { id: `${country.id}--`, name: "--" };
      level2By1[country.id] = [pseudo];

      const citiesRaw = csc.City.getCitiesOfCountry(country.id);
      level3By2[pseudo.id] = citiesRaw
        .map((c) => ({ id: `${country.id}--:${c.name}`, name: c.name }))
        .sort((a, b) => a.name.localeCompare(b.name, "en"));
      continue;
    }

    level2By1[country.id] = states;

    for (const state of states) {
      const [, stateIso] = state.id.split("-", 2);
      const citiesRaw = csc.City.getCitiesOfState(country.id, stateIso);
      level3By2[state.id] = citiesRaw
        .map((c) => ({ id: `${state.id}:${c.name}`, name: c.name }))
        .sort((a, b) => a.name.localeCompare(b.name, "en"));
    }
  }

  return {
    labels: { level1: "国家", level2: "州省", level3: "城市" },
    hierarchy: { level1: countries, level2By1, level3By2 },
  };
};

let chinaCache: Promise<LocationPickerSchema> | null = null;
let worldCache: Promise<LocationPickerSchema> | null = null;

export const loadLocationPickerSchema = async (region: RegionType): Promise<LocationPickerSchema> => {
  if (region === "domestic") {
    chinaCache ??= buildChinaHierarchy();
    return chinaCache;
  }

  worldCache ??= buildWorldHierarchy();
  return worldCache;
};

export const findSelectionByNames = (
  schema: LocationPickerSchema,
  names: { level1?: string; level2?: string; level3?: string },
): { level1Id?: string; level2Id?: string; level3Id?: string } => {
  const { hierarchy } = schema;
  const level1 = hierarchy.level1.find((n) => (names.level1 ? n.name === names.level1 : false));
  if (!level1) return {};

  const level2 = (hierarchy.level2By1[level1.id] ?? []).find((n) =>
    names.level2 ? n.name === names.level2 : false,
  );
  if (!level2) return { level1Id: level1.id };

  const level3 = (hierarchy.level3By2[level2.id] ?? []).find((n) =>
    names.level3 ? n.name === names.level3 : false,
  );
  return { level1Id: level1.id, level2Id: level2.id, level3Id: level3?.id };
};

const idToName = (list: LocationNode[], id?: string) => list.find((n) => n.id === id)?.name;

export const formatSelection = (
  schema: LocationPickerSchema,
  ids: { level1Id?: string; level2Id?: string; level3Id?: string },
) => {
  const { hierarchy } = schema;
  const level1Name = idToName(hierarchy.level1, ids.level1Id);
  const level2Name = ids.level1Id ? idToName(hierarchy.level2By1[ids.level1Id] ?? [], ids.level2Id) : undefined;
  const level3Name = ids.level2Id ? idToName(hierarchy.level3By2[ids.level2Id] ?? [], ids.level3Id) : undefined;

  return [level1Name, level2Name, level3Name].filter(Boolean).join(" ");
};
