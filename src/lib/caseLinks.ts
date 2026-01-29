import type { ModuleType } from "@/lib/types";

export const rulesHref = (module: ModuleType) => `/${module}/rules`;

export const recordEditHref = (module: ModuleType, id: string) => {
  const encodedId = encodeURIComponent(id);
  if (module === "bazi") return `/bazi/edit/${encodedId}`;
  return `/liuyao/edit/${encodedId}`;
};

export const recordAnalysisHref = (module: ModuleType, id: string) => {
  const encodedId = encodeURIComponent(id);
  if (module === "bazi") return `/bazi/analysis/${encodedId}`;
  return `/liuyao/analysis/${encodedId}`;
};

export const newCaseHref = (module: ModuleType) => {
  if (module === "bazi") return "/bazi/new";
  return "/liuyao/new";
};
