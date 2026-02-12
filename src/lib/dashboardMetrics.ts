import type { ConsultationRecord, Customer, Rule } from "@/lib/types";

export function getDashboardCounts({
  customers,
  records,
  rules,
}: {
  customers: Customer[];
  records: ConsultationRecord[];
  rules: Rule[];
}) {
  const recordCounts = records.reduce(
    (acc, r) => {
      acc.total += 1;
      if (r.module === "bazi") acc.bazi += 1;
      if (r.module === "liuyao") acc.liuyao += 1;
      return acc;
    },
    { total: 0, bazi: 0, liuyao: 0 },
  );

  return {
    customers: customers.length,
    records: recordCounts.total,
    baziRecords: recordCounts.bazi,
    liuyaoRecords: recordCounts.liuyao,
    rules: rules.length,
  };
}

