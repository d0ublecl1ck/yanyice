import { coerceHexagramName, deriveLinesFromHexagramNames } from "@/lib/liuyao/hexagramName";
import {
  parseLiuyaoDateTimeFromGregorianLike,
  parseLiuyaoDateTimeFromIsoLike,
  parseLiuyaoDateTimeFromSolarLike,
} from "@/lib/liuyao/recognitionTime";
import { LineType, type LiuyaoGender } from "@/lib/types";

const coerceString = (v: unknown) => (typeof v === "string" ? v.trim() : "");

const topicToTag = (topic: string) => {
  const s = topic.trim();
  if (!s) return null;

  if (s.includes("寻物")) return "寻物卦";
  if (s.includes("感情") || s.includes("婚姻")) return "感情卦";
  if (s.includes("事业")) return "事业卦";
  if (s.includes("财")) return "财运卦";
  if (s.includes("健康")) return "健康卦";
  if (s.includes("学业")) return "学业卦";
  if (s.includes("出行")) return "出行卦";
  if (s.includes("诉讼")) return "诉讼卦";
  if (s.includes("家宅")) return "家宅卦";
  if (s.includes("其他")) return "其他卦";

  return null;
};

const coerceLiuyaoTag = (input: unknown) => {
  if (typeof input === "string") {
    const s = input.trim();
    if (!s) return null;
    return s.endsWith("卦") ? s : `${s}卦`;
  }
  if (Array.isArray(input)) {
    const first = input.find((v) => typeof v === "string" && v.trim());
    return typeof first === "string" ? coerceLiuyaoTag(first) : null;
  }
  return null;
};

const coerceLiuyaoGender = (input: unknown): LiuyaoGender | null => {
  const s = coerceString(input);
  if (!s) return null;
  if (s === "男") return "male";
  if (s === "女") return "female";
  if (s === "不详" || s === "不祥") return "unknown";
  return null;
};

const normalizeLineText = (raw: string) => raw.trim().replace(/（.*?）/g, "").replace(/\s+/g, "");

const coerceLineTypeFromText = (raw: string): LineType | null => {
  const s = normalizeLineText(raw);
  if (s === "少阳") return LineType.SHAO_YANG;
  if (s === "少阴") return LineType.SHAO_YIN;
  if (s === "老阳") return LineType.LAO_YANG;
  if (s === "老阴") return LineType.LAO_YIN;
  return null;
};

const coerceLinesFromPan = (input: unknown) => {
  if (!Array.isArray(input) || input.length !== 6) return null;
  const mapped: LineType[] = [];
  for (const it of input) {
    if (typeof it !== "string") return null;
    const t = coerceLineTypeFromText(it);
    if (t == null) return null;
    mapped.push(t);
  }
  return mapped;
};

export type NormalizedLiuyaoAiPrefill = {
  subject?: string;
  gender?: LiuyaoGender;
  tag?: string;
  baseHexagramName?: string;
  changedHexagramName?: string;
  lines?: LineType[];
  qiguaMode?: "lines" | "hexagramName";
  time?: { dateIso: string; timeHHmm: string };
};

export const normalizeLiuyaoAiPrefill = (input: unknown): NormalizedLiuyaoAiPrefill => {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const obj = input as Record<string, unknown>;

  const subject = coerceString(obj.subject) || undefined;
  const gender = coerceLiuyaoGender(obj.gender);
  const tag = coerceLiuyaoTag(obj.tags);

  const topic = coerceString(obj.topic);
  const topicTag = topic ? topicToTag(topic) : null;

  let time: { dateIso: string; timeHHmm: string } | undefined;
  const iso = coerceString(obj.iso);
  if (iso) time = parseLiuyaoDateTimeFromIsoLike(iso) ?? undefined;
  if (!time) time = parseLiuyaoDateTimeFromSolarLike(obj.solar) ?? undefined;
  if (!time) {
    const timeObj = obj.time && typeof obj.time === "object" ? (obj.time as Record<string, unknown>) : null;
    time = timeObj ? parseLiuyaoDateTimeFromGregorianLike(timeObj.gregorian) ?? undefined : undefined;
  }

  // Prefer legacy numeric lines; fall back to pan.lines (text).
  const legacyLines = Array.isArray(obj.lines) ? obj.lines : null;
  const hasLegacyLines =
    legacyLines &&
    legacyLines.length === 6 &&
    legacyLines.every((n) => Number.isInteger(n) && (n as number) >= 0 && (n as number) <= 3);
  const mappedLegacyLines = hasLegacyLines ? (legacyLines as number[]).map((n) => n as LineType) : null;

  const pan = obj.pan && typeof obj.pan === "object" ? (obj.pan as Record<string, unknown>) : null;
  const panLines = pan ? coerceLinesFromPan(pan.lines) : null;

  const rawBase = coerceString(obj.baseHexagramName);
  const rawChanged = coerceString(obj.changedHexagramName);
  const panHex =
    pan && pan.hexagram && typeof pan.hexagram === "object" ? (pan.hexagram as Record<string, unknown>) : null;
  const panBase = panHex ? coerceString(panHex.original) : "";
  const panChanged = panHex ? coerceString(panHex.changed) : "";

  const baseCandidate = rawBase || panBase;
  const changedCandidate = rawChanged || panChanged;
  const baseHexagramName = (coerceHexagramName(baseCandidate) ?? baseCandidate) || undefined;
  const changedHexagramName = (coerceHexagramName(changedCandidate) ?? changedCandidate) || undefined;

  const derivedByName =
    baseHexagramName && changedHexagramName
      ? deriveLinesFromHexagramNames(baseHexagramName, changedHexagramName)
      : null;

  if (derivedByName) {
    return {
      subject,
      gender: gender ?? undefined,
      tag: tag ?? topicTag ?? undefined,
      baseHexagramName,
      changedHexagramName,
      lines: derivedByName,
      qiguaMode: "hexagramName",
      time,
    };
  }

  const lines = mappedLegacyLines ?? panLines ?? undefined;
  return {
    subject,
    gender: gender ?? undefined,
    tag: tag ?? topicTag ?? undefined,
    baseHexagramName,
    changedHexagramName,
    lines,
    qiguaMode: lines ? "lines" : undefined,
    time,
  };
};
