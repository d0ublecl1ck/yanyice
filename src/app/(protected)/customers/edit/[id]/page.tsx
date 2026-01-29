import { CustomerEditView } from "../../_components/CustomerEditView";

export default function Page({ params }: { params: { id: string } }) {
  const { id } = params;
  return <CustomerEditView id={id} />;
}
