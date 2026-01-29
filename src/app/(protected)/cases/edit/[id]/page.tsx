import { CaseEditView } from "../../_components/CaseEditView";

export default function Page({ params }: { params: { id: string } }) {
  const { id } = params;
  return <CaseEditView id={id} />;
}
