import { CaseEditView } from "../_components/CaseEditView";
import { redirect } from "next/navigation";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const sp = (await searchParams) ?? {};
  const moduleParam = sp.module;
  const module = Array.isArray(moduleParam) ? moduleParam[0] : moduleParam;
  if (module === "bazi") {
    const customerIdParam = sp.customerId;
    const customerId = Array.isArray(customerIdParam) ? customerIdParam[0] : customerIdParam;
    redirect(customerId ? `/bazi/new?customerId=${encodeURIComponent(customerId)}` : "/bazi/new");
  }
  return <CaseEditView />;
}
