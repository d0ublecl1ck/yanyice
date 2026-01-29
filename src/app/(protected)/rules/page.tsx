import { redirect } from "next/navigation";

import { coerceModuleType } from "@/lib/moduleParam";
import { rulesHref } from "@/lib/caseLinks";

export default function Page({
  searchParams,
}: {
  searchParams?: {
    module?: string;
  };
}) {
  const moduleType = coerceModuleType(searchParams?.module) ?? "liuyao";
  redirect(rulesHref(moduleType));
}
