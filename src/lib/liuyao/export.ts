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

const mdInline = (text: string) => text.replaceAll("|", "\\|");

const mdTable = (headers: string[], rows: string[][]) => {
  const headerLine = `| ${headers.map(mdInline).join(" | ")} |`;
  const sepLine = `| ${headers.map(() => "---").join(" | ")} |`;
  const rowLines = rows.map((r) => `| ${r.map((c) => mdInline(c)).join(" | ")} |`);
  return [headerLine, sepLine, ...rowLines].join("\n");
};

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

  lines.push("# 六爻卦例导出");
  lines.push("");
  lines.push(`- ID：${params.id}`);
  lines.push(`- 题目：${params.subject}`);
  if (params.customerName) lines.push(`- 客户：${params.customerName}`);
  if (params.solarDate) lines.push(`- 时间：${params.solarDate}`);
  if (params.monthBranch) lines.push(`- 月建：${params.monthBranch}`);
  if (params.dayBranch) lines.push(`- 日辰：${params.dayBranch}`);

  if (params.fourPillars) {
    const fp = params.fourPillars;
    lines.push(`- 四柱：${fp.yearGanzhi} ${fp.monthGanzhi} ${fp.dayGanzhi} ${fp.hourGanzhi}`);
    if (fp.xunKong) lines.push(`- 旬空：${fp.xunKong}`);
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

    const baseTitle = p.base.name ? joinNonEmpty([p.base.name, palace ? `（${palace}）` : null], " ") : null;
    if (baseTitle) lines.push(`- 本卦：${baseTitle}`);
    const changedTitle = p.changed.name ? joinNonEmpty([p.changed.name, changedPalace ? `（${changedPalace}）` : null], " ") : null;
    if (changedTitle) lines.push(`- 变卦：${changedTitle}`);
  }

  lines.push("");

  if (params.paipan) {
    lines.push("## 排盘（上六→初六）");
    lines.push("");
    const fromTop = [...params.paipan.lines].reverse();

    const rows = fromTop.map((l, idxFromTop) => {
      const pos = `${6 - idxFromTop}爻`;
      const sixGodText = l.sixGod ?? ANIMALS[idxFromTop % 6];

      const baseSymbol = `${l.symbol}${l.isMoving ? ` ${markToText(l.moveMark)}` : ""}`.trim();
      const baseShiying = joinNonEmpty([l.isShi ? "世" : null, l.isYing ? "应" : null], "");
      const baseCell = joinNonEmpty(
        [
          joinNonEmpty([l.relative, `${l.najia.text}${l.najia.element}`]),
          baseSymbol,
          baseShiying ? `(${baseShiying})` : null,
        ],
        "<br/>",
      );

      const changedSymbol = (LINE_SYMBOLS[l.changedLineType]?.base ?? "").trim();
      const changedShiying = joinNonEmpty([l.changedIsShi ? "世" : null, l.changedIsYing ? "应" : null], "");
      const changedCell = joinNonEmpty(
        [
          joinNonEmpty([l.changedRelative, `${l.changedNajia.text}${l.changedNajia.element}`]),
          changedSymbol,
          changedShiying ? `(${changedShiying})` : null,
        ],
        "<br/>",
      );

      return [pos, sixGodText, baseCell, changedCell];
    });

    lines.push(
      mdTable(["位置", "六神", "本卦", "变卦"], rows),
    );
    lines.push("");
  }

  lines.push("## 神煞");
  lines.push("");
  const sha = params.shenSha?.items ?? [];
  if (sha.length) {
    lines.push(sha.map((it) => `${it.name}—${it.branch}`).join("、"));
  } else {
    lines.push("（无/暂缺）");
  }
  lines.push("");

  lines.push("## 断语简析");
  lines.push("");
  lines.push(params.notes?.trim() ? params.notes.trim() : "（无）");
  lines.push("");

  const chat = params.chatHistory ?? [];
  if (chat.length) {
    lines.push("## 对话记录");
    lines.push("");
    const chatRows = chat.map((m) => [
      m.role === "user" ? "我" : "助手",
      m.text,
    ]);
    lines.push(mdTable(["角色", "内容"], chatRows));
    lines.push("");
  }

  return lines.join("\n").trim() + "\n";
}
