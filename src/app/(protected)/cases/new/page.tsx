import { coerceModuleType } from "@/lib/moduleParam";

import { NewBazi } from "./_components/NewBazi";
import { NewLiuyao } from "./_components/NewLiuyao";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const sp = (await searchParams) ?? {};
  const moduleParam = Array.isArray(sp.module) ? sp.module[0] : sp.module;
  const moduleType = coerceModuleType(moduleParam);

  const customerId = Array.isArray(sp.customerId) ? sp.customerId[0] : sp.customerId;

  if (moduleType === "bazi") return <NewBazi customerId={customerId} />;
  return <NewLiuyao />;
}
