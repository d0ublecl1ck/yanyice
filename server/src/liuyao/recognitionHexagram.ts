type YinYangBit = 0 | 1; // 0=yin, 1=yang

const TRIGRAM_BY_IMAGE: Readonly<Record<string, string>> = {
  天: "乾",
  泽: "兑",
  火: "离",
  雷: "震",
  风: "巽",
  水: "坎",
  山: "艮",
  地: "坤",
} as const;

// Bits are top-to-bottom (upper line -> lower line), consistent with the frontend `TRIGRAMS` keys.
const TRIGRAM_BITS_TOP_TO_BOTTOM: Readonly<Record<string, [YinYangBit, YinYangBit, YinYangBit]>> = {
  乾: [1, 1, 1],
  兑: [0, 1, 1],
  离: [1, 0, 1],
  震: [0, 0, 1],
  巽: [1, 1, 0],
  坎: [0, 1, 0],
  艮: [1, 0, 0],
  坤: [0, 0, 0],
} as const;

const HEXAGRAM_NAMES: readonly string[] = [
  "乾为天",
  "天风姤",
  "天山遁",
  "天地否",
  "风地观",
  "山地剥",
  "火地晋",
  "火天大有",
  "兑为泽",
  "泽水困",
  "泽地萃",
  "泽山咸",
  "水山蹇",
  "地山谦",
  "雷山小过",
  "雷泽归妹",
  "离为火",
  "火山旅",
  "火风鼎",
  "火水未济",
  "山水蒙",
  "风水涣",
  "天水讼",
  "天火同人",
  "震为雷",
  "雷地豫",
  "雷水解",
  "雷风恒",
  "地风升",
  "水风井",
  "泽风大过",
  "泽雷随",
  "巽为风",
  "风天小畜",
  "风火家人",
  "风雷益",
  "天雷无妄",
  "火雷噬嗑",
  "山雷颐",
  "山风蛊",
  "坎为水",
  "水泽节",
  "水雷屯",
  "水火既济",
  "泽火革",
  "雷火丰",
  "地火明夷",
  "地水师",
  "艮为山",
  "山火贲",
  "山天大畜",
  "山泽损",
  "火泽睽",
  "天泽履",
  "风泽中孚",
  "风山渐",
  "坤为地",
  "地雷复",
  "地泽临",
  "地天泰",
  "雷天大壮",
  "泽天夬",
  "水天需",
  "水地比",
] as const;

const normalizeText = (input: string) =>
  input
    .trim()
    .replace(/\s+/g, "")
    .replace(/[，,。\.；;、]/g, "")
    .replace(/：/g, ":");

const trigramBitsBottomToTopFromTrigramName = (name: string) => {
  const t = TRIGRAM_BITS_TOP_TO_BOTTOM[name];
  if (!t) return null;
  // Convert top-to-bottom [top, mid, bot] into bottom-to-top [bot, mid, top].
  return [t[2], t[1], t[0]] as const;
};

const trigramsFromHexagramName = (name: string) => {
  if (name.includes("为")) {
    const image = name.split("为")[1]?.[0] ?? "";
    const trigram = TRIGRAM_BY_IMAGE[image];
    if (!trigram) return null;
    return { upperTrigram: trigram, lowerTrigram: trigram };
  }

  const upperImage = name[0] ?? "";
  const lowerImage = name[1] ?? "";
  const upperTrigram = TRIGRAM_BY_IMAGE[upperImage];
  const lowerTrigram = TRIGRAM_BY_IMAGE[lowerImage];
  if (!upperTrigram || !lowerTrigram) return null;
  return { upperTrigram, lowerTrigram };
};

const bitsBottomToTopFromHexagramName = (name: string) => {
  const trigrams = trigramsFromHexagramName(name);
  if (!trigrams) return null;
  const lower = trigramBitsBottomToTopFromTrigramName(trigrams.lowerTrigram);
  const upper = trigramBitsBottomToTopFromTrigramName(trigrams.upperTrigram);
  if (!lower || !upper) return null;
  return [...lower, ...upper] as const;
};

export const parseHexagramPairFromText = (
  input: string,
): { baseHexagramName: string; changedHexagramName?: string } | null => {
  const s = normalizeText(input);
  if (!s) return null;

  const connectors = ["变为", "变成", "变", "之", "化", "->", "→", "=>", "＞", ">"];
  const idx = connectors
    .map((c) => ({ c, i: s.indexOf(c) }))
    .filter((x) => x.i >= 0)
    .sort((a, b) => a.i - b.i)[0];

  const findLastNameIn = (chunk: string) => {
    let best: { name: string; at: number } | null = null;
    for (const n of HEXAGRAM_NAMES) {
      const at = chunk.lastIndexOf(n);
      if (at < 0) continue;
      if (!best || at > best.at || (at === best.at && n.length > best.name.length)) best = { name: n, at };
    }
    return best?.name ?? null;
  };

  const findFirstNameIn = (chunk: string) => {
    let best: { name: string; at: number } | null = null;
    for (const n of HEXAGRAM_NAMES) {
      const at = chunk.indexOf(n);
      if (at < 0) continue;
      if (!best || at < best.at || (at === best.at && n.length > best.name.length)) best = { name: n, at };
    }
    return best?.name ?? null;
  };

  if (idx) {
    const left = s.slice(0, idx.i);
    const right = s.slice(idx.i + idx.c.length);
    const base = findLastNameIn(left) ?? findFirstNameIn(left);
    const changed = findFirstNameIn(right) ?? findLastNameIn(right);
    if (!base) return null;
    return changed ? { baseHexagramName: base, changedHexagramName: changed } : { baseHexagramName: base };
  }

  // No explicit connector: try to find a single hexagram occurrence.
  const base = findFirstNameIn(s);
  if (!base) return null;
  return { baseHexagramName: base };
};

export const deriveLinesFromHexagramNames = (baseHexagramName: string, changedHexagramName?: string) => {
  const baseBits = bitsBottomToTopFromHexagramName(baseHexagramName);
  if (!baseBits || baseBits.length !== 6) return null;

  const changedBits = changedHexagramName ? bitsBottomToTopFromHexagramName(changedHexagramName) : null;
  const hasChanged = Boolean(changedBits && changedBits.length === 6);

  // LineType: 0=少阳, 1=少阴, 2=老阳（动）, 3=老阴（动）
  const lines = baseBits.map((b, i) => {
    const baseIsYang = b === 1;
    const changedIsYang = hasChanged ? (changedBits![i] === 1) : baseIsYang;
    if (baseIsYang === changedIsYang) return baseIsYang ? 0 : 1;
    return baseIsYang ? 2 : 3;
  });

  return lines;
};

