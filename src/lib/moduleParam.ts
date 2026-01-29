import type { ModuleType } from "@/lib/types";

export type CaseFilter = "all" | ModuleType;

export const coerceModuleType = (value: string | null | undefined): ModuleType | null => {
  if (value === "liuyao" || value === "bazi") return value;
  return null;
};

export const coerceCaseFilter = (value: string | null | undefined): CaseFilter | null => {
  if (value === "all") return "all";
  return coerceModuleType(value);
};

