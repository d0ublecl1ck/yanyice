import { CaseEditPage } from "@/yanyice/pages/cases/CaseEditPage";

export default function Page({ params }: { params: { id: string } }) {
  const { id } = params;
  return <CaseEditPage id={id} />;
}
