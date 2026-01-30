import { ANIMALS, LINE_SYMBOLS } from "@/lib/constants";
import type { LiuyaoPaipan } from "@/lib/liuyao/paipan";

type ExportChatMessage = { role: "user" | "model"; text: string };
type ExportFourPillars = {
  yearGanzhi: string;
  monthGanzhi: string;
  dayGanzhi: string;
  hourGanzhi: string;
  xunKong: string | null;
};

const joinNonEmpty = (parts: Array<string | null | undefined>, sep = " ") =>
  parts
    .map((p) => (p ?? "").trim())
    .filter(Boolean)
    .join(sep);

const markToText = (mark: string) => (mark === "O" ? "○" : mark === "X" ? "×" : mark);

export function formatLiuyaoExportText(params: {
  id: string;
  subject: string;
  customerName?: string | null;
  solarDate?: string | null;
  monthBranch?: string | null;
  dayBranch?: string | null;
  notes?: string | null;
  fourPillars?: ExportFourPillars | null;
  paipan?: LiuyaoPaipan | null;
  shenSha?: { items?: Array<{ name: string; branch: string }> } | null;
  chatHistory?: ExportChatMessage[] | null;
}): string {
  const lines: string[] = [];

  lines.push("【六爻卦例导出】");
  lines.push(`ID：${params.id}`);
  lines.push(`题目：${params.subject}`);
  if (params.customerName) lines.push(`客户：${params.customerName}`);
  if (params.solarDate) lines.push(`时间：${params.solarDate}`);

  const monthDay = joinNonEmpty([
    params.monthBranch ? `月建：${params.monthBranch}` : null,
    params.dayBranch ? `日辰：${params.dayBranch}` : null,
  ]);
  if (monthDay) lines.push(monthDay);

  if (params.fourPillars) {
    const fp = params.fourPillars;
    lines.push(`四柱：${fp.yearGanzhi} ${fp.monthGanzhi} ${fp.dayGanzhi} ${fp.hourGanzhi}`);
    if (fp.xunKong) lines.push(`旬空：${fp.xunKong}`);
  }

  if (params.paipan) {
    const p = params.paipan;
    const palace =
      p.palace.name && p.palace.generation
        ? `${p.palace.name}宫${p.palace.generation}`
        : p.palace.name
          ? `${p.palace.name}宫`
          : null;
    const changedPalace =
      p.changedPalace.name && p.changedPalace.generation
        ? `${p.changedPalace.name}宫${p.changedPalace.generation}`
        : p.changedPalace.name
          ? `${p.changedPalace.name}宫`
          : null;

    const baseTitle = p.base.name ? joinNonEmpty([`本卦：${p.base.name}`, palace ? `（${palace}）` : null], "") : null;
    if (baseTitle) lines.push(baseTitle);
    const changedTitle = p.changed.name
      ? joinNonEmpty([`变卦：${p.changed.name}`, changedPalace ? `（${changedPalace}）` : null], "")
      : null;
    if (changedTitle) lines.push(changedTitle);
  }

  lines.push("");

  if (params.paipan) {
    lines.push("【排盘（上六→初六）】");
    const fromTop = [...params.paipan.lines].reverse();
    fromTop.forEach((l, idxFromTop) => {
      const sixGodText = l.sixGod ?? ANIMALS[idxFromTop % 6];
      const baseMark = l.isMoving ? ` ${markToText(l.moveMark)}` : "";
      const baseShiying = `${l.isShi ? "世" : ""}${l.isYing ? "应" : ""}`;

      const changedSymbol = LINE_SYMBOLS[l.changedLineType]?.base ?? "";
      const changedShiying = `${l.changedIsShi ? "世" : ""}${l.changedIsYing ? "应" : ""}`;

      lines.push(
        `第${6 - idxFromTop}爻：${sixGodText}｜${l.relative} ${l.najia.text}${l.najia.element}｜${l.symbol}${baseMark} ${baseShiying}`.trim(),
      );
      lines.push(
        `      变：${l.changedRelative} ${l.changedNajia.text}${l.changedNajia.element}｜${changedSymbol} ${changedShiying}`.trim(),
      );
    });
    lines.push("");
  }

  lines.push("【神煞】");
  const sha = params.shenSha?.items ?? [];
  if (sha.length) {
    lines.push(sha.map((it) => `${it.name}—${it.branch}`).join("、"));
  } else {
    lines.push("（无/暂缺）");
  }
  lines.push("");

  lines.push("【断语简析】");
  lines.push(params.notes?.trim() ? params.notes.trim() : "（无）");
  lines.push("");

  const chat = params.chatHistory ?? [];
  if (chat.length) {
    lines.push("【对话记录】");
    chat.forEach((m) => {
      const who = m.role === "user" ? "我" : "助手";
      lines.push(`${who}：${m.text}`);
    });
    lines.push("");
  }

  return lines.join("\n").trim() + "\n";
}

