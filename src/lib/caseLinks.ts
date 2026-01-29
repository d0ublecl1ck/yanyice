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

export const newCaseHref = (module: ModuleType, opts?: { customerId?: string }) => {
  const customerId = opts?.customerId?.trim();

  if (module === "bazi") {
    const qs = new URLSearchParams({ new: "1" });
    if (customerId) qs.set("customerId", customerId);
    return `/bazi?${qs.toString()}`;
  }

  const base = "/liuyao/new";
  if (!customerId) return base;
  const qs = new URLSearchParams({ customerId });
  return `${base}?${qs.toString()}`;
};
