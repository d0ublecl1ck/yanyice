import { redirect } from "next/navigation";

import { coerceModuleType } from "@/lib/moduleParam";
import { rulesPathForModule } from "@/lib/rulesRoutes";

export default function Page({
  searchParams,
}: {
  searchParams?: {
    module?: string;
  };
}) {
  const moduleType = coerceModuleType(searchParams?.module) ?? "liuyao";
  redirect(rulesPathForModule(moduleType));
}
