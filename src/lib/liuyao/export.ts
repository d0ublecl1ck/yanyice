import { ANIMALS } from "@/lib/constants";
import type { LiuyaoPaipan } from "@/lib/liuyao/paipan";
import type { LiuyaoGender } from "@/lib/types";

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

const yaoLabelByPosFromTop = (posFromTop: number) =>
  (["上爻", "五爻", "四爻", "三爻", "二爻", "初爻"] as const)[posFromTop] ?? `${posFromTop + 1}爻`;

const posLabelByPosFromTop = (posFromTop: number) =>
  (["上", "五", "四", "三", "二", "初"] as const)[posFromTop] ?? `${posFromTop + 1}`;

const getSixGodText = (posFromTop: number, fallbackIdx: number, sixGod: string | null) =>
  sixGod ?? ANIMALS[(fallbackIdx ?? posFromTop) % 6] ?? ANIMALS[0];

const formatShenSha = (items: Array<{ name: string; branch: string }>) =>
  items.map((it) => `${it.name}在${it.branch}`).join("、");

const liuyaoGenderText = (g: LiuyaoGender | null | undefined) =>
  g === "male" ? "男" : g === "female" ? "女" : "不祥";

export function formatLiuyaoExportText(params: {
  id: string;
  subject: string;
  customerName?: string | null;
  gender?: LiuyaoGender | null;
  solarDate?: string | null;
  monthBranch?: string | null;
  dayBranch?: string | null;
  fourPillars?: ExportFourPillars | null;
  paipan?: LiuyaoPaipan | null;
  shenSha?: { items?: Array<{ name: string; branch: string }> } | null;
  chatHistory?: ExportChatMessage[] | null;
}): string {
  const lines: string[] = [];

  lines.push("一、 基础信息");
  lines.push("");
  lines.push(`- 占事：${params.subject}`);
  if (params.customerName) lines.push(`- 缘主：${params.customerName}`);
  if (params.gender) lines.push(`- 性别：${liuyaoGenderText(params.gender)}`);
  lines.push("- 排卦工具：（未记录）");
  if (params.solarDate) lines.push(`- 起卦时间：${params.solarDate}`);

  if (params.fourPillars) {
    const fp = params.fourPillars;
    lines.push(`- 干支：${fp.yearGanzhi}年 ${fp.monthGanzhi}月 ${fp.dayGanzhi}日 ${fp.hourGanzhi}时`);
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
    const changedTitle = p.changed.name ? joinNonEmpty([p.changed.name, changedPalace ? `（${changedPalace}）` : null], " ") : null;
    void baseTitle;
    void changedTitle;
  }

  const sha = params.shenSha?.items ?? [];
  if (sha.length) lines.push(`- 神煞：${formatShenSha(sha)}`);

  lines.push("");
  lines.push("二、 卦象结构");
  lines.push("");
  if (params.paipan?.base.name) lines.push(`- 本卦：${params.paipan.base.name}（${params.paipan.palace.name ?? "未知"}宫）`);
  if (params.paipan?.changed.name)
    lines.push(`- 变卦：${params.paipan.changed.name}（${params.paipan.changedPalace.name ?? "未知"}宫）`);

  if (params.paipan) {
    const moving = params.paipan.lines.filter((l) => l.isMoving);
    if (moving.length) {
      const desc = moving
        .map((l) => {
          const sixGod = l.sixGod ?? ANIMALS[l.indexFromBottom % 6] ?? "六神";
          const basePosFromTop = 5 - l.indexFromBottom;
          const baseYao = yaoLabelByPosFromTop(basePosFromTop);
          const changedYao = baseYao;
          return `${sixGod}位的${l.relative}${l.najia.text}${l.najia.element}爻（本卦${baseYao}）发动，变为${l.changedRelative}${l.changedNajia.text}${l.changedNajia.element}爻（变卦${changedYao}）`;
        })
        .join("；");
      lines.push(`- 动爻：${desc}`);
    } else {
      lines.push("- 动爻：（无）");
    }
  }

  lines.push("");
  lines.push("三、 六神与爻位详解");
  lines.push("");

  if (params.paipan) {
    const fromTop = [...params.paipan.lines].reverse();

    const baseTitle = params.paipan.base.name
      ? `1. 本卦：${params.paipan.base.name}（${params.paipan.palace.name ?? "未知"}宫）`
      : "1. 本卦：（未知）";
    lines.push(baseTitle);
    lines.push("");

    const baseRows = fromTop.map((l, posFromTop) => {
      const sixGod = getSixGodText(posFromTop, posFromTop, l.sixGod);
      const yao = yaoLabelByPosFromTop(posFromTop);
      const zhi = l.najia.branch;
      const statusParts: Array<string | null> = [
        l.isMoving ? `发动${l.moveMark ? `(${markToText(l.moveMark)})` : ""}` : "静爻",
        l.isShi ? "世" : null,
        l.isYing ? "应" : null,
        l.isMoving ? `化${l.changedRelative}` : null,
      ];
      const status = joinNonEmpty(statusParts, "、");
      const pos = posLabelByPosFromTop(posFromTop);
      return [sixGod, yao, l.relative, zhi, status, pos];
    });

    lines.push(mdTable(["六神", "爻位", "六亲", "地支", "状态", "位置"], baseRows));
    lines.push("");

    const changedTitle = params.paipan.changed.name
      ? `2. 变卦：${params.paipan.changed.name}（${params.paipan.changedPalace.name ?? "未知"}宫）`
      : "2. 变卦：（未知）";
    lines.push(changedTitle);
    lines.push("");

    const changedRows = fromTop.map((l, posFromTop) => {
      const sixGod = getSixGodText(posFromTop, posFromTop, l.sixGod);
      const yao = yaoLabelByPosFromTop(posFromTop);
      const zhi = l.changedNajia.branch;
      const statusParts: Array<string | null> = [
        l.isMoving ? "化爻" : "静爻",
        l.changedIsShi ? "世" : null,
        l.changedIsYing ? "应" : null,
      ];
      const status = joinNonEmpty(statusParts, "、");
      const pos = posLabelByPosFromTop(posFromTop);
      return [sixGod, yao, l.changedRelative, zhi, status, pos];
    });

    lines.push(mdTable(["六神", "爻位", "六亲", "地支", "状态", "位置"], changedRows));
    lines.push("");
  }

  const chat = params.chatHistory ?? [];
  if (chat.length) {
    lines.push("四、 对话记录");
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
