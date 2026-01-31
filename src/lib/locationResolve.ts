import type { LocationPickerSchema } from "@/lib/locationData";
import type { LocationNode } from "@/lib/locationSearch";

const normalize = (input: string) => {
  return input
    .trim()
    .replace(/[\s,，/|·]+/g, "")
    .replace(/[省市区县盟州地区旗]$/g, "")
    .toLowerCase();
};

function bestMatch(nodes: LocationNode[], rawQuery: string): LocationNode | null {
  const q = normalize(rawQuery);
  if (!q) return null;

  let best: { node: LocationNode; score: number } | null = null;
  for (const node of nodes) {
    const nameRaw = node.name ?? "";
    const name = normalize(nameRaw);
    if (!name) continue;

    const hit = q.includes(name) || name.includes(q);
    if (!hit) continue;

    const score = Math.min(name.length, q.length);
    if (!best || score > best.score) best = { node, score };
  }
  return best?.node ?? null;
}

export function resolveLocationIdsFromText(
  schema: LocationPickerSchema,
  text: string,
): { level1Id?: string; level2Id?: string; level3Id?: string } {
  const q = text.trim();
  if (!q) return {};

  const { hierarchy } = schema;
  const province = bestMatch(hierarchy.level1, q);
  if (province) {
    const cities = hierarchy.level2By1[province.id] ?? [];
    const city = bestMatch(cities, q);
    if (!city) return { level1Id: province.id };
    const districts = hierarchy.level3By2[city.id] ?? [];
    const district = bestMatch(districts, q);
    return { level1Id: province.id, level2Id: city.id, level3Id: district?.id };
  }

  // Fallback: match by city across all provinces when province text is omitted (e.g. "杭州 西湖").
  let bestCity:
    | { provinceId: string; city: LocationNode; score: number }
    | null = null;
  for (const p of hierarchy.level1) {
    const cities = hierarchy.level2By1[p.id] ?? [];
    const city = bestMatch(cities, q);
    if (!city) continue;
    const score = normalize(city.name).length;
    if (!bestCity || score > bestCity.score) bestCity = { provinceId: p.id, city, score };
  }
  if (!bestCity) return {};

  const districts = hierarchy.level3By2[bestCity.city.id] ?? [];
  const district = bestMatch(districts, q);
  return { level1Id: bestCity.provinceId, level2Id: bestCity.city.id, level3Id: district?.id };
}

