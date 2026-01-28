import { CustomerEditPage } from "@/yanyice/pages/customers/CustomerEditPage";

export default function Page({ params }: { params: { id: string } }) {
  const { id } = params;
  return <CustomerEditPage id={id} />;
}
