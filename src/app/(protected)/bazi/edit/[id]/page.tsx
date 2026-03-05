import { BaziEditView } from "../../_components/BaziEditView";

type PageProps = { params: Promise<{ id: string }> | { id: string } };

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <BaziEditView id={id} />;
}
