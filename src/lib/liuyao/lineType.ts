import { LineType } from "@/lib/types";

export type LineNature = "yang" | "yin";

export const getLineNature = (line: LineType): LineNature => {
  return line === LineType.SHAO_YANG || line === LineType.LAO_YANG ? "yang" : "yin";
};

export const isLineMoving = (line: LineType): boolean => {
  return line === LineType.LAO_YANG || line === LineType.LAO_YIN;
};

export const toLineType = (nature: LineNature, moving: boolean): LineType => {
  if (nature === "yang") return moving ? LineType.LAO_YANG : LineType.SHAO_YANG;
  return moving ? LineType.LAO_YIN : LineType.SHAO_YIN;
};

export const getMovingMarkText = (line: LineType): "○" | "×" | "" => {
  if (line === LineType.LAO_YANG) return "○";
  if (line === LineType.LAO_YIN) return "×";
  return "";
};
