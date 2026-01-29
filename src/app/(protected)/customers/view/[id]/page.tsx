import CustomerViewClient from "./CustomerViewClient";

type PageProps = { params: Promise<{ id: string }> | { id: string } };

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <CustomerViewClient id={id} />;
}

