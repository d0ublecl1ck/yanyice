import { redirect } from "next/navigation";

import { newCaseHref } from "@/lib/caseLinks";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const sp = (await searchParams) ?? {};
  const customerId = Array.isArray(sp.customerId) ? sp.customerId[0] : sp.customerId;
  redirect(newCaseHref("liuyao", { customerId }));
}
