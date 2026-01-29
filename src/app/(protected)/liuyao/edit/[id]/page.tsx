import { redirect } from "next/navigation";

export default function Page({ params }: { params: { id: string } }) {
  redirect(`/cases/edit/${encodeURIComponent(params.id)}?module=liuyao`);
}

