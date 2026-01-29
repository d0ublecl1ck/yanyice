import { redirect } from "next/navigation";

import { newCaseHref } from "@/lib/caseLinks";

export function NewBazi({ customerId }: { customerId?: string }) {
  redirect(newCaseHref("bazi", { customerId }));
}

