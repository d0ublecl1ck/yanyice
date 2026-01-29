import { CaseEditView } from "../_components/CaseEditView";
import { redirect } from "next/navigation";

export default function Page({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const moduleParam = searchParams?.module;
  const module = Array.isArray(moduleParam) ? moduleParam[0] : moduleParam;
  if (module === "bazi") {
    const customerIdParam = searchParams?.customerId;
    const customerId = Array.isArray(customerIdParam) ? customerIdParam[0] : customerIdParam;
    redirect(customerId ? `/bazi/new?customerId=${encodeURIComponent(customerId)}` : "/bazi/new");
  }
  return <CaseEditView />;
}
