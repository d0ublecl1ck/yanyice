import { CaseEditView } from "../../_components/CaseEditView";

type PageProps = { params: Promise<{ id: string }> | { id: string } };

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <CaseEditView id={id} />;
}
