"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BriefcaseBusiness, CreditCard, IndianRupee, NotebookText } from "lucide-react";
import { formatCurrency } from "@/lib/invoice-utils";

interface SupplierPayment {
  id: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  reference: string | null;
}

interface SupplierPurchase {
  id: string;
  invoiceNumber: string;
  purchaseDate: string;
  totalAmount: number;
  isCompleted: boolean;
  payments: SupplierPayment[];
}

interface SupplierPaymentHistory {
  id: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  reference: string | null;
  purchase?: { invoiceNumber: string; totalAmount: number };
}

interface SupplierDetail {
  id: string;
  name: string;
  contactPerson: string | null;
  mobile: string;
  city: string;
  rating: number;
  purchases: SupplierPurchase[];
  paymentHistory?: SupplierPaymentHistory[];
}

export default function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [supplier, setSupplier] = useState<SupplierDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const resolved = await params;
      const response = await fetch(`/api/suppliers/${resolved.id}`);
      const data = (await response.json()) as SupplierDetail;
      setSupplier(data);
      setLoading(false);
    };

    load();
  }, [params]);

  const totalPayable = useMemo(() => {
    if (!supplier) return 0;
    return supplier.purchases.reduce((sum, purchase) => {
      const paid = purchase.payments.reduce((pSum, payment) => pSum + payment.amount, 0);
      return sum + Math.max(0, purchase.totalAmount - paid);
    }, 0);
  }, [supplier]);

  if (loading) return <div className="p-8 text-gray-600">Loading supplier details...</div>;
  if (!supplier) return <div className="p-8 text-red-600">Supplier not found.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/suppliers" className="inline-flex items-center gap-2 text-sm text-brand-emerald">
            <ArrowLeft size={16} /> Back
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{supplier.name}</h1>
            <p className="text-gray-600">{supplier.contactPerson || "Primary contact not set"}</p>
          </div>
        </div>
        <Link href="/dashboard/accounting" className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
          Record supplier payment
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Mobile" value={supplier.mobile} icon={<CreditCard size={18} />} />
        <Stat label="City" value={supplier.city} icon={<BriefcaseBusiness size={18} />} />
        <Stat label="Open payable" value={formatCurrency(totalPayable)} icon={<IndianRupee size={18} />} tone="warning" />
        <Stat label="Purchases" value={String(supplier.purchases?.length || 0)} icon={<NotebookText size={18} />} />
      </div>

      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">Purchase & payment allocation</h2>
        <div className="space-y-4">
          {supplier.purchases?.length ? supplier.purchases.map((purchase) => {
            const paid = purchase.payments.reduce((sum, payment) => sum + payment.amount, 0);
            const due = Math.max(0, purchase.totalAmount - paid);
            const paymentStatus = due <= 0 ? "Paid" : paid > 0 ? "Partial" : "Unpaid";
            const receiptStatus = purchase.isCompleted ? "Receipt confirmed" : "Pending approval";

            return (
              <div key={purchase.id} className="rounded-xl border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link href={`/dashboard/purchases/${purchase.id}`} className="font-semibold text-brand-emerald hover:underline">
                      {purchase.invoiceNumber}
                    </Link>
                    <p className="text-xs text-gray-500">{new Date(purchase.purchaseDate).toLocaleDateString("en-IN")}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-800">{receiptStatus}</span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${due <= 0 ? "bg-emerald-100 text-emerald-800" : paid > 0 ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-700"}`}>
                      {paymentStatus}
                    </span>
                  </div>
                </div>

                <div className="mt-3 grid gap-2 text-sm md:grid-cols-3">
                  <p>PO total: <span className="font-semibold">{formatCurrency(purchase.totalAmount)}</span></p>
                  <p>Paid: <span className="font-semibold">{formatCurrency(paid)}</span></p>
                  <p>Due: <span className="font-semibold">{formatCurrency(due)}</span></p>
                </div>

                {purchase.payments.length > 0 && (
                  <div className="mt-3 border-t pt-3 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Settlement trail</p>
                    {purchase.payments.map((payment) => (
                      <div key={payment.id} className="flex flex-wrap justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm">
                        <span>{formatCurrency(payment.amount)} • {payment.paymentMethod}</span>
                        <span className="text-gray-500">{new Date(payment.paymentDate).toLocaleDateString("en-IN")}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          }) : <p className="text-gray-500">No purchases recorded.</p>}
        </div>
      </div>

      {(supplier.paymentHistory?.length ?? 0) > 0 && (
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Supplier payment history</h2>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-gray-500">
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Purchase</th>
                <th className="px-3 py-2">Method</th>
                <th className="px-3 py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {supplier.paymentHistory?.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-3 py-2">{new Date(payment.paymentDate).toLocaleDateString("en-IN")}</td>
                  <td className="px-3 py-2">{payment.purchase?.invoiceNumber ?? "—"}</td>
                  <td className="px-3 py-2">{payment.paymentMethod}</td>
                  <td className="px-3 py-2 text-right font-semibold">{formatCurrency(payment.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, icon, tone = "neutral" }: { label: string; value: string; icon: React.ReactNode; tone?: "neutral" | "warning" }) {
  return (
    <div className={`rounded-2xl border p-4 ${tone === "warning" ? "border-amber-200 bg-amber-50" : "border-gray-200 bg-white"}`}>
      <div className="mb-3 flex items-center justify-between text-gray-500">
        <span className="text-sm">{label}</span>
        <span>{icon}</span>
      </div>
      <p className="text-lg font-bold text-gray-900">{value}</p>
    </div>
  );
}
