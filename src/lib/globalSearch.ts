import type { BaZiData, ConsultationRecord, Customer, LiuYaoData } from "@/lib/types";

type Scored<T> = { item: T; score: number };

const NON_DIGITS_RE = /[^\d]+/g;
const MULTI_SPACE_RE = /\s+/g;

function normalizeText(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(MULTI_SPACE_RE, " ");
}

function normalizeDigits(input: string): string {
  return input.replace(NON_DIGITS_RE, "");
}

function splitQuery(rawQuery: string): string[] {
  const q = normalizeText(rawQuery).replace(/^#+/, "");
  if (!q) return [];

  return Array.from(new Set(q.split(" ").filter(Boolean)));
}

function isSubsequence(needle: string, haystack: string): { first: number; last: number } | null {
  if (!needle) return null;
  let needleIndex = 0;
  let first = -1;
  let last = -1;

  for (let i = 0; i < haystack.length; i++) {
    if (haystack[i] !== needle[needleIndex]) continue;
    if (first === -1) first = i;
    last = i;
    needleIndex += 1;
    if (needleIndex >= needle.length) return { first, last };
  }
  return null;
}

function scoreTextField(fieldValue: string, token: string): number {
  const field = normalizeText(fieldValue);
  if (!field) return 0;

  const idx = field.indexOf(token);
  if (idx >= 0) {
    // 前缀更高、越靠前越高、字段越短略加分
    const isPrefix = idx === 0 ? 80 : 0;
    const position = Math.max(0, 300 - idx * 3);
    const compactness = Math.max(0, 80 - Math.floor(field.length / 12));
    return 600 + isPrefix + position + compactness;
  }

  // 兜底：子序列匹配（“模糊”）
  const compactField = field.replaceAll(" ", "");
  if (token.length >= 2) {
    const res = isSubsequence(token, compactField);
    if (res) {
      const span = res.last - res.first + 1;
      const gaps = span - token.length;
      const tight = Math.max(0, 240 - gaps * 8);
      const early = Math.max(0, 120 - res.first * 3);
      return 220 + tight + early;
    }
  }

  return 0;
}

function scoreDigitsField(fieldDigits: string, token: string): number {
  const tokenDigits = normalizeDigits(token);
  if (tokenDigits.length < 3) return 0;
  if (!fieldDigits) return 0;
  const idx = fieldDigits.indexOf(tokenDigits);
  if (idx < 0) return 0;
  const early = Math.max(0, 300 - idx * 8);
  return 700 + early;
}

type WeightedField = { weight: number; value: string; mode?: "text" | "digits" };

function scoreByFields(fields: WeightedField[], rawQuery: string): number {
  const tokens = splitQuery(rawQuery);
  if (tokens.length === 0) return 0;

  let total = 0;
  for (const token of tokens) {
    let bestForToken = 0;
    for (const field of fields) {
      const base =
        field.mode === "digits"
          ? scoreDigitsField(field.value, token)
          : scoreTextField(field.value, token);
      bestForToken = Math.max(bestForToken, base * field.weight);
    }
    if (bestForToken <= 0) return 0; // 多词查询时，要求每个 token 都能命中（任意字段均可）
    total += bestForToken;
  }
  return total;
}

function baziSearchFields(data: BaZiData | undefined): WeightedField[] {
  if (!data) return [];
  return [
    { weight: 1, value: `${data.yearStem}${data.yearBranch}` },
    { weight: 1, value: `${data.monthStem}${data.monthBranch}` },
    { weight: 1, value: `${data.dayStem}${data.dayBranch}` },
    { weight: 1, value: `${data.hourStem}${data.hourBranch}` },
    { weight: 1, value: data.birthDate ?? "" },
    { weight: 1, value: data.location ?? "" },
    { weight: 1, value: data.category ?? "" },
  ];
}

function liuyaoSearchFields(data: LiuYaoData | undefined): WeightedField[] {
  if (!data) return [];
  return [
    { weight: 1, value: data.date ?? "" },
    { weight: 1, value: data.monthBranch ?? "" },
    { weight: 1, value: data.dayBranch ?? "" },
  ];
}

export function searchCustomers(customers: Customer[], rawQuery: string, limit = 5): Customer[] {
  const query = rawQuery.trim();
  if (!query) return [];

  const scored: Scored<Customer>[] = customers
    .map((customer) => {
      const customFieldEntries = Object.entries(customer.customFields ?? {});
      const customFieldText = customFieldEntries
        .flatMap(([k, v]) => [k, v])
        .filter(Boolean)
        .join(" ");

      const phoneDigits = normalizeDigits(customer.phone ?? "");

      const score = scoreByFields(
        [
          { weight: 5, value: customer.name ?? "" },
          { weight: 4, value: customer.phone ?? "" },
          { weight: 4, value: phoneDigits, mode: "digits" },
          { weight: 4, value: (customer.tags ?? []).join(" ") },
          { weight: 2, value: customer.notes ?? "" },
          { weight: 1, value: customer.birthDate ?? "" },
          { weight: 1, value: customer.birthTime ?? "" },
          { weight: 1, value: customFieldText },
        ],
        query,
      );

      return { item: customer, score };
    })
    .filter((x) => x.score > 0);

  scored.sort((a, b) => b.score - a.score || (b.item.createdAt ?? 0) - (a.item.createdAt ?? 0));
  return scored.slice(0, limit).map((x) => x.item);
}

export function searchRecords(records: ConsultationRecord[], rawQuery: string, limit = 5): ConsultationRecord[] {
  const query = rawQuery.trim();
  if (!query) return [];

  const scored: Scored<ConsultationRecord>[] = records
    .map((record) => {
      const score = scoreByFields(
        [
          { weight: 5, value: record.subject ?? "" },
          { weight: 4, value: (record.tags ?? []).join(" ") },
          { weight: 3, value: record.customerName ?? "" },
          { weight: 2, value: record.notes ?? "" },
          { weight: 1, value: record.verifiedNotes ?? "" },
          ...liuyaoSearchFields(record.liuyaoData),
          ...baziSearchFields(record.baziData),
        ],
        query,
      );

      return { item: record, score };
    })
    .filter((x) => x.score > 0);

  scored.sort((a, b) => b.score - a.score || (b.item.createdAt ?? 0) - (a.item.createdAt ?? 0));
  return scored.slice(0, limit).map((x) => x.item);
}
