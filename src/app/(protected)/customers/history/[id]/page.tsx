import { CustomerHistoryPage } from "@/yanyice/pages/customers/CustomerHistoryPage";

export default function Page({ params }: { params: { id: string } }) {
  const { id } = params;
  return <CustomerHistoryPage id={id} />;
}
