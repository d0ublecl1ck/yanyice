import { redirect } from "next/navigation";

type PageProps = { params: Promise<{ id: string }> | { id: string } };

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  redirect(`/cases/edit/${encodeURIComponent(id)}?module=liuyao`);
}
