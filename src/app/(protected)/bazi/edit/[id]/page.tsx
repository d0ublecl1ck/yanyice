import { BaziEditView } from "../../_components/BaziEditView";

export default function Page({ params }: { params: { id: string } }) {
  return <BaziEditView id={params.id} />;
}

