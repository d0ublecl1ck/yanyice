import CustomerHistoryClient from "./CustomerHistoryClient";

type PageProps = { params: Promise<{ id: string }> | { id: string } };

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <CustomerHistoryClient id={id} />;
}

