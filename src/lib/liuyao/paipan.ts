import type { LineType, LiuYaoData } from "@/lib/types";
import { LINE_SYMBOLS, TRIGRAMS } from "@/lib/constants";
import { calcLiuyaoGanzhiFromIso } from "@/lib/lunarGanzhi";
import {
  elementByBranch,
  getHexagramMetaByTrigrams,
  getHexagramNameByTrigrams,
  NAJIA_BRANCHES,
  NAJIA_STEMS,
  relativeOf,
  SIX_GOD_ORDER,
  sixGodStartIndexByDayStem,
  SHI_YING_BY_GENERATION,
  TRIGRAM_ELEMENT,
  type HexagramMeta,
  type LineNajia,
  type SixGod,
  type TrigramName,
} from "@/lib/liuyao/wenwang";

export type YinYang = "yin" | "yang";

export type LiuyaoLine = {
  indexFromBottom: number;
  lineType: LineType;
  yinYang: YinYang;
  isMoving: boolean;
  symbol: string;
  moveMark: string;
  sixGod: SixGod | null;
  najia: LineNajia;
  relative: string;
  isShi: boolean;
  isYing: boolean;
};

export type LiuyaoHexagram = {
  name: string | null;
  upper: TrigramName;
  lower: TrigramName;
  meta: HexagramMeta | null;
};

export type LiuyaoPaipan = {
  monthBranch: string | null;
  dayGanzhi: string | null;
  dayStem: string | null;
  base: LiuyaoHexagram;
  changed: LiuyaoHexagram;
  palace: {
    name: TrigramName | null;
    element: string | null;
    generation: string | null;
    shiLineIndexFromBottom: number | null;
    yingLineIndexFromBottom: number | null;
  };
  lines: LiuyaoLine[];
};

function yinYangOfLine(line: LineType): YinYang {
  return line === 0 || line === 2 ? "yang" : "yin";
}

function isMovingLine(line: LineType): boolean {
  return line === 2 || line === 3;
}

function normalizeToBaseYinYang(line: LineType): YinYang {
  return yinYangOfLine(line);
}

function changedYinYang(line: LineType): YinYang {
  if (line === 2) return "yin";
  if (line === 3) return "yang";
  return yinYangOfLine(line);
}

function trigramKeyTopToBottom(bitsBottomToTop: readonly YinYang[]): string {
  const b0 = bitsBottomToTop[0] === "yang" ? "1" : "0";
  const b1 = bitsBottomToTop[1] === "yang" ? "1" : "0";
  const b2 = bitsBottomToTop[2] === "yang" ? "1" : "0";
  return `${b2}${b1}${b0}`;
}

function trigramFromLines(linesBottomToTop: readonly YinYang[]): TrigramName {
  const key = trigramKeyTopToBottom(linesBottomToTop);
  const trigram = TRIGRAMS[key as keyof typeof TRIGRAMS] as TrigramName | undefined;
  if (!trigram) throw new Error(`Unknown trigram key: ${key}`);
  return trigram;
}

function buildNajia(lower: TrigramName, upper: TrigramName): LineNajia[] {
  const lowerBranches = NAJIA_BRANCHES[lower];
  const upperBranches = NAJIA_BRANCHES[upper];
  const lowerStem = NAJIA_STEMS[lower].inner;
  const upperStem = NAJIA_STEMS[upper].outer;

  const res: LineNajia[] = [];
  for (let i = 0; i < 6; i++) {
    const branch = (i < 3 ? lowerBranches[i] : upperBranches[i])!;
    const stem = i < 3 ? lowerStem : upperStem;
    const element = elementByBranch(branch);
    res.push({ stem, branch, text: `${stem}${branch}`, element });
  }
  return res;
}

const BRANCHES = "子丑寅卯辰巳午未申酉戌亥";
const STEMS = "甲乙丙丁戊己庚辛壬癸";

function isGanzhi(text: string): boolean {
  if (text.length !== 2) return false;
  return STEMS.includes(text[0] ?? "") && BRANCHES.includes(text[1] ?? "");
}

function isBranch(text: string): boolean {
  return text.length === 1 && BRANCHES.includes(text);
}

function coerceDayStem(d: LiuYaoData): { monthBranch: string | null; dayGanzhi: string | null; dayStem: string | null } {
  const storedMonthBranch = (d.monthBranch ?? "").trim();
  const storedDayGanzhi = (d.dayBranch ?? "").trim();

  const useStored = isBranch(storedMonthBranch) && isGanzhi(storedDayGanzhi);
  const source = useStored ? null : calcLiuyaoGanzhiFromIso(d.date);

  const monthBranch = (useStored ? storedMonthBranch : source?.monthBranch ?? storedMonthBranch).trim() || null;
  const dayGanzhi = (useStored ? storedDayGanzhi : source?.dayGanzhi ?? storedDayGanzhi).trim() || null;
  const dayStem = (source?.dayStem ?? dayGanzhi?.[0] ?? "").trim() || null;
  return { monthBranch, dayGanzhi, dayStem };
}

export function paipanLiuyao(data: LiuYaoData): LiuyaoPaipan {
  if (data.lines.length !== 6) throw new Error("lines must have 6 items");

  const baseYinYang = data.lines.map(normalizeToBaseYinYang);
  const changedLinesYinYang = data.lines.map(changedYinYang);

  const lower = trigramFromLines(baseYinYang.slice(0, 3));
  const upper = trigramFromLines(baseYinYang.slice(3, 6));
  const baseName = getHexagramNameByTrigrams(upper, lower);
  const baseMeta = baseName ? getHexagramMetaByTrigrams(upper, lower) : null;

  const lowerChanged = trigramFromLines(changedLinesYinYang.slice(0, 3));
  const upperChanged = trigramFromLines(changedLinesYinYang.slice(3, 6));
  const changedName = getHexagramNameByTrigrams(upperChanged, lowerChanged);
  const changedMeta = changedName ? getHexagramMetaByTrigrams(upperChanged, lowerChanged) : null;

  const palaceName = baseMeta?.palace ?? null;
  const palaceElement = palaceName ? TRIGRAM_ELEMENT[palaceName] : null;
  const generation = baseMeta?.generation ?? null;
  const shiYing = generation ? SHI_YING_BY_GENERATION[generation] : null;
  const shiLineIndexFromBottom = shiYing?.shiLineIndexFromBottom ?? null;
  const yingLineIndexFromBottom = shiYing?.yingLineIndexFromBottom ?? null;

  const { monthBranch, dayGanzhi, dayStem } = coerceDayStem(data);
  const sixGodStart = dayStem ? sixGodStartIndexByDayStem(dayStem) : null;

  const najia = buildNajia(lower, upper);

  const lines: LiuyaoLine[] = data.lines.map((line, idxFromBottom) => {
    const meta = LINE_SYMBOLS[line] ?? LINE_SYMBOLS[0];
    const yy = baseYinYang[idxFromBottom]!;
    const isMoving = isMovingLine(line);
    const sixGod =
      sixGodStart === null ? null : (SIX_GOD_ORDER[(sixGodStart + idxFromBottom) % 6] as SixGod);

    const lineNajia = najia[idxFromBottom]!;
    const relative = palaceElement ? relativeOf(lineNajia.element, palaceElement) : "父母";

    return {
      indexFromBottom: idxFromBottom,
      lineType: line,
      yinYang: yy,
      isMoving,
      symbol: meta.base,
      moveMark: meta.mark,
      sixGod,
      najia: lineNajia,
      relative,
      isShi: shiLineIndexFromBottom === idxFromBottom,
      isYing: yingLineIndexFromBottom === idxFromBottom,
    };
  });

  return {
    monthBranch,
    dayGanzhi,
    dayStem,
    base: { name: baseName, upper, lower, meta: baseMeta },
    changed: { name: changedName, upper: upperChanged, lower: lowerChanged, meta: changedMeta },
    palace: {
      name: palaceName,
      element: palaceElement,
      generation,
      shiLineIndexFromBottom,
      yingLineIndexFromBottom,
    },
    lines,
  };
}
