import { LineType } from "@/lib/types";

import { HEXAGRAM_NAMES, getHexagramMetaByName, type TrigramName } from "@/lib/liuyao/wenwang";

type YinYangBit = 0 | 1; // 0=yin, 1=yang

// Bits are top-to-bottom (upper line -> lower line), consistent with the frontend `TRIGRAMS` keys.
const TRIGRAM_BITS_TOP_TO_BOTTOM: Readonly<Record<TrigramName, readonly [YinYangBit, YinYangBit, YinYangBit]>> = {
  乾: [1, 1, 1],
  兑: [0, 1, 1],
  离: [1, 0, 1],
  震: [0, 0, 1],
  巽: [1, 1, 0],
  坎: [0, 1, 0],
  艮: [1, 0, 0],
  坤: [0, 0, 0],
} as const;

const normalizeText = (input: string) =>
  input
    .trim()
    .replace(/\s+/g, "")
    .replace(/[，,。\.；;、]/g, "")
    .replace(/：/g, ":");

const NORMALIZED_NAME_TO_CANONICAL = new Map<string, string>(
  HEXAGRAM_NAMES.map((n) => [normalizeText(n), n]),
);

export function coerceHexagramName(input: string): string | null {
  const s = normalizeText(input);
  if (!s) return null;

  const exact = NORMALIZED_NAME_TO_CANONICAL.get(s);
  if (exact) return exact;

  let best: { canonical: string; normalized: string } | null = null;
  for (const [normalized, canonical] of NORMALIZED_NAME_TO_CANONICAL.entries()) {
    if (!s.includes(normalized) && !normalized.includes(s)) continue;
    if (!best || normalized.length > best.normalized.length) best = { canonical, normalized };
  }
  return best?.canonical ?? null;
}

function trigramBitsBottomToTopFromTrigramName(name: TrigramName) {
  const t = TRIGRAM_BITS_TOP_TO_BOTTOM[name];
  if (!t) return null;
  // Convert top-to-bottom [top, mid, bot] into bottom-to-top [bot, mid, top].
  return [t[2], t[1], t[0]] as const;
}

function bitsBottomToTopFromHexagramName(name: string) {
  const canonical = coerceHexagramName(name);
  if (!canonical) return null;
  const meta = getHexagramMetaByName(canonical);
  if (!meta) return null;

  const lower = trigramBitsBottomToTopFromTrigramName(meta.lower);
  const upper = trigramBitsBottomToTopFromTrigramName(meta.upper);
  if (!lower || !upper) return null;
  return [...lower, ...upper] as const;
}

export function deriveLinesFromHexagramNames(baseHexagramName: string, changedHexagramName?: string) {
  const baseBits = bitsBottomToTopFromHexagramName(baseHexagramName);
  if (!baseBits || baseBits.length !== 6) return null;

  const changedBits = changedHexagramName ? bitsBottomToTopFromHexagramName(changedHexagramName) : null;
  const hasChanged = Boolean(changedBits && changedBits.length === 6);

  const lines = baseBits.map((b, i) => {
    const baseIsYang = b === 1;
    const changedIsYang = hasChanged ? changedBits![i] === 1 : baseIsYang;
    if (baseIsYang === changedIsYang) return baseIsYang ? LineType.SHAO_YANG : LineType.SHAO_YIN;
    return baseIsYang ? LineType.LAO_YANG : LineType.LAO_YIN;
  });

  return lines;
}

