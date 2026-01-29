import { redirect } from "next/navigation";

import { coerceCaseFilter } from "@/lib/moduleParam";
import { CaseAll } from "./_components/caseAll";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const sp = (await searchParams) ?? {};
  const moduleParam = sp.module;
  const moduleValue = Array.isArray(moduleParam) ? moduleParam[0] : moduleParam;

  if (moduleValue === "liuyao") redirect("/liuyao");
  if (moduleValue === "bazi") redirect("/bazi");

  const initialFilter = coerceCaseFilter(moduleValue) ?? "all";
  return <CaseAll initialFilter={initialFilter} />;
}
