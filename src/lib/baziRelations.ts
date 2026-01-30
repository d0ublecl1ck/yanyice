type WuXing = "木" | "火" | "土" | "金" | "水";

const STEMS = "甲乙丙丁戊己庚辛壬癸";
const BRANCHES = "子丑寅卯辰巳午未申酉戌亥";

const STEM_WUXING: Record<string, WuXing> = {
  甲: "木",
  乙: "木",
  丙: "火",
  丁: "火",
  戊: "土",
  己: "土",
  庚: "金",
  辛: "金",
  壬: "水",
  癸: "水",
};

const WUXING_CONTROLS: Record<WuXing, WuXing> = {
  木: "土",
  土: "水",
  水: "火",
  火: "金",
  金: "木",
};

const STEM_HE: Array<{ a: string; b: string; hua: WuXing }> = [
  { a: "甲", b: "己", hua: "土" },
  { a: "乙", b: "庚", hua: "金" },
  { a: "丙", b: "辛", hua: "水" },
  { a: "丁", b: "壬", hua: "木" },
  { a: "戊", b: "癸", hua: "火" },
];

const STEM_CHONG: Array<[string, string]> = [
  ["甲", "庚"],
  ["乙", "辛"],
  ["丙", "壬"],
  ["丁", "癸"],
];

const BRANCH_SANHE: Array<{ order: [string, string, string]; ju: WuXing }> = [
  { order: ["申", "子", "辰"], ju: "水" },
  { order: ["寅", "午", "戌"], ju: "火" },
  { order: ["亥", "卯", "未"], ju: "木" },
  { order: ["巳", "酉", "丑"], ju: "金" },
];

const BRANCH_LIUHE: Array<[string, string]> = [
  ["子", "丑"],
  ["寅", "亥"],
  ["卯", "戌"],
  ["辰", "酉"],
  ["巳", "申"],
  ["午", "未"],
];

const BRANCH_CHONG: Array<[string, string]> = [
  ["子", "午"],
  ["丑", "未"],
  ["寅", "申"],
  ["卯", "酉"],
  ["辰", "戌"],
  ["巳", "亥"],
];

const BRANCH_HAI: Array<[string, string]> = [
  ["子", "未"],
  ["丑", "午"],
  ["寅", "巳"],
  ["卯", "辰"],
  ["申", "亥"],
  ["酉", "戌"],
];

const BRANCH_PO: Array<[string, string]> = [
  ["子", "酉"],
  ["卯", "午"],
  ["辰", "丑"],
  ["未", "戌"],
  ["寅", "亥"],
  ["巳", "申"],
];

const BRANCH_ANHE: Array<[string, string]> = [
  ["子", "巳"],
  ["丑", "寅"],
  ["卯", "申"],
  ["辰", "酉"],
  ["巳", "戌"],
  ["午", "亥"],
];

const BRANCH_XING_EDGES: Array<[string, string]> = [
  ["子", "卯"],
  ["寅", "巳"],
  ["巳", "申"],
  ["申", "寅"],
  ["丑", "戌"],
  ["戌", "未"],
  ["未", "丑"],
];

const BRANCH_SELF_XING = new Set(["辰", "午", "酉", "亥"]);

function stemIndex(stem: string) {
  return STEMS.indexOf(stem);
}

function branchIndex(branch: string) {
  return BRANCHES.indexOf(branch);
}

function sortPairByIndex(a: string, b: string, idx: (x: string) => number) {
  const ia = idx(a);
  const ib = idx(b);
  if (ia === -1 || ib === -1) return a <= b ? [a, b] : [b, a];
  return ia <= ib ? [a, b] : [b, a];
}

function hasPair(list: Array<[string, string]>, a: string, b: string) {
  return list.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

export function calcTianGanNotes(stems: string[]): string[] {
  const normalized = stems.filter(Boolean);
  const found = new Map<string, { priority: number; order: string }>();

  for (let i = 0; i < normalized.length; i++) {
    for (let j = i + 1; j < normalized.length; j++) {
      const a = normalized[i]!;
      const b = normalized[j]!;
      if (a === b) continue;

      const [x, y] = sortPairByIndex(a, b, stemIndex);
      const orderKey = `${stemIndex(x)}-${stemIndex(y)}`;

      if (hasPair(STEM_CHONG, a, b)) {
        const text = `${x}${y}相冲`;
        found.set(text, { priority: 50, order: orderKey });
      }

      const he = STEM_HE.find((p) => (p.a === a && p.b === b) || (p.a === b && p.b === a));
      if (he) {
        const text = `${x}${y}合${he.hua}`;
        found.set(text, { priority: 40, order: orderKey });
      }

      const ea = STEM_WUXING[a];
      const eb = STEM_WUXING[b];
      if (ea && eb && (WUXING_CONTROLS[ea] === eb || WUXING_CONTROLS[eb] === ea)) {
        const text = `${x}${y}相克`;
        found.set(text, { priority: 30, order: orderKey });
      }
    }
  }

  return Array.from(found.entries())
    .sort((a, b) => b[1].priority - a[1].priority || a[1].order.localeCompare(b[1].order))
    .map(([text]) => text);
}

export function calcDiZhiNotes(branches: string[]): string[] {
  const normalized = branches.filter(Boolean);
  const uniq = Array.from(new Set(normalized));
  const found = new Map<string, { priority: number; order: string }>();

  const minPos = (target: string) => {
    const idx = normalized.indexOf(target);
    return idx === -1 ? 99 : idx;
  };

  for (const triad of BRANCH_SANHE) {
    const [a, b, c] = triad.order;
    const hasA = uniq.includes(a);
    const hasB = uniq.includes(b);
    const hasC = uniq.includes(c);

    if (hasA && hasB && hasC) {
      const text = `${a}${b}${c}三合${triad.ju}局`;
      found.set(text, { priority: 100, order: `${minPos(a)}-${minPos(b)}-${minPos(c)}` });
      continue;
    }

    if (hasA && hasC && !hasB) {
      const text = `${a}${c}拱合${b}`;
      found.set(text, { priority: 80, order: `${minPos(a)}-${minPos(c)}` });
      continue;
    }

    if (hasA && hasB && !hasC) {
      const text = `${a}${b}半合${triad.ju}局`;
      found.set(text, { priority: 90, order: `${minPos(a)}-${minPos(b)}` });
      continue;
    }

    if (hasB && hasC && !hasA) {
      const text = `${b}${c}半合${triad.ju}局`;
      found.set(text, { priority: 90, order: `${minPos(b)}-${minPos(c)}` });
      continue;
    }
  }

  const addPair = (a: string, b: string, label: string, priority: number) => {
    const [x, y] = sortPairByIndex(a, b, branchIndex);
    const orderKey = `${branchIndex(x)}-${branchIndex(y)}`;
    const text = `${x}${y}${label}`;
    found.set(text, { priority, order: orderKey });
  };

  for (let i = 0; i < uniq.length; i++) {
    for (let j = i + 1; j < uniq.length; j++) {
      const a = uniq[i]!;
      const b = uniq[j]!;
      if (hasPair(BRANCH_LIUHE, a, b)) addPair(a, b, "六合", 70);
      if (hasPair(BRANCH_ANHE, a, b)) addPair(a, b, "暗合", 60);
      if (hasPair(BRANCH_CHONG, a, b)) addPair(a, b, "相冲", 50);
      if (hasPair(BRANCH_XING_EDGES, a, b)) addPair(a, b, "相刑", 40);
      if (hasPair(BRANCH_HAI, a, b)) addPair(a, b, "相害", 30);
      if (hasPair(BRANCH_PO, a, b)) addPair(a, b, "相破", 20);
    }
  }

  const counts = new Map<string, number>();
  for (const b of normalized) counts.set(b, (counts.get(b) ?? 0) + 1);
  for (const [b, n] of counts.entries()) {
    if (n < 2) continue;
    if (!BRANCH_SELF_XING.has(b)) continue;
    const text = `${b}${b}自刑`;
    found.set(text, { priority: 35, order: `${branchIndex(b)}-${branchIndex(b)}` });
  }

  return Array.from(found.entries())
    .sort((a, b) => b[1].priority - a[1].priority || a[1].order.localeCompare(b[1].order))
    .map(([text]) => text);
}

export function calcMingJuRelations(params: { stems: string[]; branches: string[] }) {
  const tianGan = calcTianGanNotes(params.stems);
  const diZhi = calcDiZhiNotes(params.branches);
  return { tianGan, diZhi };
}

