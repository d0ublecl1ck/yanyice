import { redirect } from "next/navigation";

import { coerceModuleType } from "@/lib/moduleParam";
import { rulesHref } from "@/lib/caseLinks";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const sp = (await searchParams) ?? {};
  const moduleParam = sp.module;
  const moduleValue = Array.isArray(moduleParam) ? moduleParam[0] : moduleParam;
  const moduleType = coerceModuleType(moduleValue) ?? "liuyao";
  redirect(rulesHref(moduleType));
}
