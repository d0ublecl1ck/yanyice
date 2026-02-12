export type TrigramName = "乾" | "兑" | "离" | "震" | "巽" | "坎" | "艮" | "坤";

export type PalaceName = TrigramName;

export type GenerationName =
  | "本宫"
  | "一世"
  | "二世"
  | "三世"
  | "四世"
  | "五世"
  | "游魂"
  | "归魂";

export const GENERATION_BY_INDEX: readonly GenerationName[] = [
  "本宫",
  "一世",
  "二世",
  "三世",
  "四世",
  "五世",
  "游魂",
  "归魂",
] as const;

export const SHI_YING_BY_GENERATION: Readonly<
  Record<GenerationName, { shiLineIndexFromBottom: number; yingLineIndexFromBottom: number }>
> = {
  本宫: { shiLineIndexFromBottom: 5, yingLineIndexFromBottom: 2 },
  一世: { shiLineIndexFromBottom: 0, yingLineIndexFromBottom: 3 },
  二世: { shiLineIndexFromBottom: 1, yingLineIndexFromBottom: 4 },
  三世: { shiLineIndexFromBottom: 2, yingLineIndexFromBottom: 5 },
  四世: { shiLineIndexFromBottom: 3, yingLineIndexFromBottom: 0 },
  五世: { shiLineIndexFromBottom: 4, yingLineIndexFromBottom: 1 },
  游魂: { shiLineIndexFromBottom: 3, yingLineIndexFromBottom: 0 },
  归魂: { shiLineIndexFromBottom: 2, yingLineIndexFromBottom: 5 },
} as const;

export type ElementName = "木" | "火" | "土" | "金" | "水";

export const TRIGRAM_ELEMENT: Readonly<Record<TrigramName, ElementName>> = {
  乾: "金",
  兑: "金",
  离: "火",
  震: "木",
  巽: "木",
  坎: "水",
  艮: "土",
  坤: "土",
} as const;

const GENERATES: Readonly<Record<ElementName, ElementName>> = {
  木: "火",
  火: "土",
  土: "金",
  金: "水",
  水: "木",
} as const;

const OVERCOMES: Readonly<Record<ElementName, ElementName>> = {
  木: "土",
  火: "金",
  土: "水",
  金: "木",
  水: "火",
} as const;

export function isGenerating(from: ElementName, to: ElementName): boolean {
  return GENERATES[from] === to;
}

export function isOvercoming(from: ElementName, to: ElementName): boolean {
  return OVERCOMES[from] === to;
}

export type RelativeName = "父母" | "兄弟" | "子孙" | "妻财" | "官鬼";

export function relativeOf(lineEl: ElementName, palaceEl: ElementName): RelativeName {
  if (lineEl === palaceEl) return "兄弟";
  if (isGenerating(lineEl, palaceEl)) return "父母";
  if (isGenerating(palaceEl, lineEl)) return "子孙";
  if (isOvercoming(lineEl, palaceEl)) return "官鬼";
  return "妻财";
}

export type SixGod = "青龙" | "朱雀" | "勾陈" | "腾蛇" | "白虎" | "玄武";
export const SIX_GOD_ORDER: readonly SixGod[] = [
  "青龙",
  "朱雀",
  "勾陈",
  "腾蛇",
  "白虎",
  "玄武",
] as const;

export function sixGodStartIndexByDayStem(dayStem: string): number | null {
  if ("甲乙".includes(dayStem)) return 0;
  if ("丙丁".includes(dayStem)) return 1;
  if ("戊".includes(dayStem)) return 2;
  if ("己".includes(dayStem)) return 3;
  if ("庚辛".includes(dayStem)) return 4;
  if ("壬癸".includes(dayStem)) return 5;
  return null;
}

export type Branch =
  | "子"
  | "丑"
  | "寅"
  | "卯"
  | "辰"
  | "巳"
  | "午"
  | "未"
  | "申"
  | "酉"
  | "戌"
  | "亥";

export function elementByBranch(branch: Branch): ElementName {
  if ("寅卯".includes(branch)) return "木";
  if ("巳午".includes(branch)) return "火";
  if ("申酉".includes(branch)) return "金";
  if ("亥子".includes(branch)) return "水";
  return "土";
}

export type LineNajia = {
  stem: string;
  branch: Branch;
  text: string;
  element: ElementName;
};

export const NAJIA_STEMS: Readonly<Record<TrigramName, { inner: string; outer: string }>> = {
  乾: { inner: "甲", outer: "壬" },
  坤: { inner: "乙", outer: "癸" },
  艮: { inner: "丙", outer: "丙" },
  兑: { inner: "丁", outer: "丁" },
  坎: { inner: "戊", outer: "戊" },
  离: { inner: "己", outer: "己" },
  震: { inner: "庚", outer: "庚" },
  巽: { inner: "辛", outer: "辛" },
} as const;

export const NAJIA_BRANCHES: Readonly<Record<TrigramName, readonly Branch[]>> = {
  乾: ["子", "寅", "辰", "午", "申", "戌"],
  坤: ["未", "巳", "卯", "丑", "亥", "酉"],
  震: ["子", "寅", "辰", "午", "申", "戌"],
  巽: ["丑", "亥", "酉", "未", "巳", "卯"],
  坎: ["寅", "辰", "午", "申", "戌", "子"],
  离: ["卯", "丑", "亥", "酉", "未", "巳"],
  艮: ["辰", "午", "申", "戌", "子", "寅"],
  兑: ["巳", "卯", "丑", "亥", "酉", "未"],
} as const;

export type HexagramMeta = {
  name: string;
  upper: TrigramName;
  lower: TrigramName;
  palace: PalaceName;
  generation: GenerationName;
};

const IMAGE_TO_TRIGRAM: Readonly<Record<string, TrigramName>> = {
  天: "乾",
  泽: "兑",
  火: "离",
  雷: "震",
  风: "巽",
  水: "坎",
  山: "艮",
  地: "坤",
} as const;

function parseHexagramNameToTrigrams(name: string): { upper: TrigramName; lower: TrigramName } | null {
  if (name.includes("为")) {
    const parts = name.split("为");
    const image = parts[1]?.[0];
    const trigram = image ? IMAGE_TO_TRIGRAM[image] : undefined;
    if (!trigram) return null;
    return { upper: trigram, lower: trigram };
  }

  const upperImage = name[0];
  const lowerImage = name[1];
  const upper = upperImage ? IMAGE_TO_TRIGRAM[upperImage] : undefined;
  const lower = lowerImage ? IMAGE_TO_TRIGRAM[lowerImage] : undefined;
  if (!upper || !lower) return null;
  return { upper, lower };
}

export const PALACE_GROUPS: ReadonlyArray<{ palace: PalaceName; names: readonly string[] }> = [
  {
    palace: "乾",
    names: ["乾为天", "天风姤", "天山遁", "天地否", "风地观", "山地剥", "火地晋", "火天大有"],
  },
  {
    palace: "兑",
    names: ["兑为泽", "泽水困", "泽地萃", "泽山咸", "水山蹇", "地山谦", "雷山小过", "雷泽归妹"],
  },
  {
    palace: "离",
    names: ["离为火", "火山旅", "火风鼎", "火水未济", "山水蒙", "风水涣", "天水讼", "天火同人"],
  },
  {
    palace: "震",
    names: ["震为雷", "雷地豫", "雷水解", "雷风恒", "地风升", "水风井", "泽风大过", "泽雷随"],
  },
  {
    palace: "巽",
    names: ["巽为风", "风天小畜", "风火家人", "风雷益", "天雷无妄", "火雷噬嗑", "山雷颐", "山风蛊"],
  },
  {
    palace: "坎",
    names: ["坎为水", "水泽节", "水雷屯", "水火既济", "泽火革", "雷火丰", "地火明夷", "地水师"],
  },
  {
    palace: "艮",
    names: ["艮为山", "山火贲", "山天大畜", "山泽损", "火泽睽", "天泽履", "风泽中孚", "风山渐"],
  },
  {
    palace: "坤",
    names: ["坤为地", "地雷复", "地泽临", "地天泰", "雷天大壮", "泽天夬", "水天需", "水地比"],
  },
] as const;

const META_BY_NAME = new Map<string, HexagramMeta>();
const NAME_BY_TRIGRAMS = new Map<string, string>();

for (const g of PALACE_GROUPS) {
  g.names.forEach((name, idx) => {
    const parsed = parseHexagramNameToTrigrams(name);
    if (!parsed) return;
    const generation = GENERATION_BY_INDEX[idx] ?? "本宫";
    const meta: HexagramMeta = { name, upper: parsed.upper, lower: parsed.lower, palace: g.palace, generation };
    META_BY_NAME.set(name, meta);
    NAME_BY_TRIGRAMS.set(`${parsed.upper}|${parsed.lower}`, name);
  });
}

export const HEXAGRAM_NAMES: readonly string[] = PALACE_GROUPS.flatMap((g) => g.names);

export function getHexagramNameByTrigrams(upper: TrigramName, lower: TrigramName): string | null {
  return NAME_BY_TRIGRAMS.get(`${upper}|${lower}`) ?? null;
}

export function getHexagramMetaByName(name: string): HexagramMeta | null {
  return META_BY_NAME.get(name) ?? null;
}

export function getHexagramMetaByTrigrams(upper: TrigramName, lower: TrigramName): HexagramMeta | null {
  const name = getHexagramNameByTrigrams(upper, lower);
  if (!name) return null;
  return getHexagramMetaByName(name);
}
