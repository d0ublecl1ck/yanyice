import { BRANCHES, STEMS } from "@/lib/constants";

export type LiuyaoShenShaItem = { name: string; branch: string };

export type LiuyaoShenSha = {
  dayStem: string | null;
  dayBranch: string | null;
  monthBranch: string | null;
  items: LiuyaoShenShaItem[];
};

function isStem(ch: string | null | undefined): ch is string {
  if (typeof ch !== "string") return false;
  return ch.length === 1 && STEMS.includes(ch);
}

function isBranch(ch: string | null | undefined): ch is string {
  if (typeof ch !== "string") return false;
  return ch.length === 1 && BRANCHES.includes(ch);
}

function prevBranch(branch: string): string {
  const idx = BRANCHES.indexOf(branch);
  if (idx === -1) return branch;
  return BRANCHES[(idx + 11) % 12] ?? branch;
}

function trineOfDayBranch(dayBranch: string): "申子辰" | "巳酉丑" | "寅午戌" | "亥卯未" | null {
  if ("申子辰".includes(dayBranch)) return "申子辰";
  if ("巳酉丑".includes(dayBranch)) return "巳酉丑";
  if ("寅午戌".includes(dayBranch)) return "寅午戌";
  if ("亥卯未".includes(dayBranch)) return "亥卯未";
  return null;
}

function pushConcat(res: LiuyaoShenShaItem[], name: string, branches: string[]) {
  const v = branches.join("");
  if (!v) return;
  res.push({ name, branch: v });
}

export function calcLiuyaoShenSha(args: {
  dayStem: string | null | undefined;
  dayBranch: string | null | undefined;
  monthBranch: string | null | undefined;
}): LiuyaoShenSha {
  const dayStem = isStem(args.dayStem ?? null) ? args.dayStem! : null;
  const dayBranch = isBranch(args.dayBranch ?? null) ? args.dayBranch! : null;
  const monthBranch = isBranch(args.monthBranch ?? null) ? args.monthBranch! : null;

  const items: LiuyaoShenShaItem[] = [];

  if (dayStem) {
    // 贵人（日干 → 地支）
    if ("甲戊".includes(dayStem)) pushConcat(items, "贵人", ["丑", "未"]);
    else if ("乙己".includes(dayStem)) pushConcat(items, "贵人", ["子", "申"]);
    else if ("丙丁".includes(dayStem)) pushConcat(items, "贵人", ["亥", "酉"]);
    else if ("庚辛".includes(dayStem)) pushConcat(items, "贵人", ["午", "寅"]);
    else if ("壬癸".includes(dayStem)) pushConcat(items, "贵人", ["卯", "巳"]);

    // 禄神（日干 → 地支）
    const lu: Record<string, string> = {
      甲: "寅",
      乙: "卯",
      丙: "巳",
      丁: "午",
      戊: "巳",
      己: "午",
      庚: "申",
      辛: "酉",
      壬: "亥",
      癸: "子",
    };
    const luBranch = lu[dayStem];
    if (luBranch) items.push({ name: "禄神", branch: luBranch });

    // 羊刃（日干 → 地支）
    const yangRen: Record<string, string> = {
      甲: "卯",
      乙: "寅",
      丙: "午",
      丁: "巳",
      戊: "午",
      己: "巳",
      庚: "酉",
      辛: "申",
      壬: "子",
      癸: "亥",
    };
    const yangRenBranch = yangRen[dayStem];
    if (yangRenBranch) items.push({ name: "羊刃", branch: yangRenBranch });

    // 文昌（日干 → 地支）
    const wenChang: Record<string, string> = {
      甲: "巳",
      乙: "午",
      丙: "申",
      丁: "酉",
      戊: "申",
      己: "酉",
      庚: "亥",
      辛: "子",
      壬: "寅",
      癸: "卯",
    };
    const wenChangBranch = wenChang[dayStem];
    if (wenChangBranch) items.push({ name: "文昌", branch: wenChangBranch });
  }

  if (dayBranch) {
    const trine = trineOfDayBranch(dayBranch);
    if (trine) {
      const mapping: Record<
        typeof trine,
        {
          驿马: string;
          桃花: string;
          将星: string;
          劫煞: string;
          华盖: string;
          谋星: string;
          灾煞: string;
        }
      > = {
        申子辰: { 驿马: "寅", 桃花: "酉", 将星: "子", 劫煞: "巳", 华盖: "辰", 谋星: "戌", 灾煞: "午" },
        巳酉丑: { 驿马: "亥", 桃花: "午", 将星: "酉", 劫煞: "寅", 华盖: "丑", 谋星: "未", 灾煞: "卯" },
        寅午戌: { 驿马: "申", 桃花: "卯", 将星: "午", 劫煞: "亥", 华盖: "戌", 谋星: "辰", 灾煞: "子" },
        亥卯未: { 驿马: "巳", 桃花: "子", 将星: "卯", 劫煞: "申", 华盖: "未", 谋星: "丑", 灾煞: "酉" },
      };

      const v = mapping[trine];
      items.push({ name: "驿马", branch: v.驿马 });
      items.push({ name: "桃花", branch: v.桃花 });
      items.push({ name: "将星", branch: v.将星 });
      items.push({ name: "劫煞", branch: v.劫煞 });
      items.push({ name: "华盖", branch: v.华盖 });
      items.push({ name: "谋星", branch: v.谋星 });
      items.push({ name: "灾煞", branch: v.灾煞 });
    }
  }

  if (monthBranch) {
    // 天医（月支为标尺：占卦之月的前一位地支）
    items.push({ name: "天医", branch: prevBranch(monthBranch) });

    // 天喜（按季节）
    const tianXi =
      "寅卯辰".includes(monthBranch)
        ? "戌"
        : "巳午未".includes(monthBranch)
          ? "丑"
          : "申酉戌".includes(monthBranch)
            ? "辰"
            : "亥子丑".includes(monthBranch)
              ? "未"
              : null;
    if (tianXi) items.push({ name: "天喜", branch: tianXi });
  }

  return { dayStem, dayBranch, monthBranch, items };
}
