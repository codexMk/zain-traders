import InvoiceDetailView from "@/components/billing/invoice-detail-view";

export const metadata = {
  title: "Invoice Details - Zain Traders",
};

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <InvoiceDetailView invoiceId={id} />;
}
