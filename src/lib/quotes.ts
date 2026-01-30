import type { Quote } from "@/lib/types";

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function selectDailyQuotes(params: {
  quotes: Quote[];
  date: Date;
  userSeed?: string | null;
  count: number;
}): Quote[] {
  const enabled = params.quotes.filter((q) => q.enabled);
  if (enabled.length === 0) return [];

  const count = Math.max(1, Math.min(params.count, enabled.length));
  const dateKey = params.date.toISOString().slice(0, 10);
  const seed = `${params.userSeed ?? ""}:${dateKey}`;
  const startIndex = hashString(seed) % enabled.length;

  const selected: Quote[] = [];
  for (let i = 0; i < count; i += 1) {
    selected.push(enabled[(startIndex + i) % enabled.length]!);
  }
  return selected;
}

