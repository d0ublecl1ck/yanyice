import { CustomerEditView } from "../../_components/CustomerEditView";

type PageProps = { params: Promise<{ id: string }> | { id: string } };

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <CustomerEditView id={id} />;
}
