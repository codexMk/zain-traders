"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CreditCard, IndianRupee, ReceiptText, WalletCards } from "lucide-react";
import { formatCurrency } from "@/lib/invoice-utils";

interface InvoicePayment {
  id: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  reference: string | null;
}

interface InvoiceSummary {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string | null;
  totalAmount: number;
  paidAmount: number;
  status: string;
  payments?: InvoicePayment[];
}

interface PaymentEntry {
  id: string;
  invoiceId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  reference: string | null;
  invoice?: { invoiceNumber: string; totalAmount: number };
}

interface CustomerDetail {
  id: string;
  name: string;
  mobile: string;
  address: string | null;
  gstNumber: string | null;
  creditLimit: number;
  outstandingAmount: number;
  invoices: InvoiceSummary[];
  paymentHistory: PaymentEntry[];
}

function allocationBadge(totalAmount: number, paidAmount: number) {
  const remaining = Math.max(0, totalAmount - paidAmount);
  if (remaining <= 0) return { label: "Paid", className: "bg-emerald-100 text-emerald-800" };
  if (paidAmount > 0) return { label: "Partial", className: "bg-amber-100 text-amber-800" };
  return { label: "Open", className: "bg-sky-100 text-sky-800" };
}

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const resolved = await params;
      const response = await fetch(`/api/customers/${resolved.id}`);
      const data = (await response.json()) as CustomerDetail;
      setCustomer(data);
      setLoading(false);
    };

    load();
  }, [params]);

  const computedOutstanding = useMemo(() => {
    if (!customer) return 0;
    return customer.invoices.reduce(
      (sum, invoice) => sum + Math.max(0, invoice.totalAmount - invoice.paidAmount),
      0,
    );
  }, [customer]);

  if (loading) {
    return <div className="p-8 text-gray-600">Loading customer details...</div>;
  }

  if (!customer) {
    return <div className="p-8 text-red-600">Customer not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/customers" className="inline-flex items-center gap-2 text-sm text-brand-emerald">
            <ArrowLeft size={16} /> Back
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{customer.name}</h1>
            <p className="text-gray-600">{customer.mobile}</p>
          </div>
        </div>
        <Link
          href="/dashboard/accounting"
          className="rounded-xl bg-brand-emerald px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          Record payment
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Credit limit" value={formatCurrency(customer.creditLimit || 0)} icon={<IndianRupee size={18} />} />
        <Stat label="Outstanding" value={formatCurrency(customer.outstandingAmount || computedOutstanding)} icon={<WalletCards size={18} />} tone="danger" />
        <Stat label="Invoices" value={String(customer.invoices?.length || 0)} icon={<ReceiptText size={18} />} />
        <Stat label="Payments" value={String(customer.paymentHistory?.length || 0)} icon={<CreditCard size={18} />} />
      </div>

      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Invoice settlement ledger</h2>
        <div className="space-y-4">
          {customer.invoices?.length ? customer.invoices.map((invoice) => {
            const badge = allocationBadge(invoice.totalAmount, invoice.paidAmount);
            const remaining = Math.max(0, invoice.totalAmount - invoice.paidAmount);
            const payments = invoice.payments ?? [];

            return (
              <div key={invoice.id} className="rounded-xl border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link href={`/dashboard/billing/${invoice.id}`} className="font-semibold text-brand-emerald hover:underline">
                      {invoice.invoiceNumber}
                    </Link>
                    <p className="text-xs text-gray-500">
                      {new Date(invoice.invoiceDate).toLocaleDateString("en-IN")}
                      {invoice.dueDate ? ` • Due ${new Date(invoice.dueDate).toLocaleDateString("en-IN")}` : ""}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badge.className}`}>{badge.label}</span>
                </div>

                <div className="mt-3 grid gap-2 text-sm md:grid-cols-4">
                  <p>Invoice total: <span className="font-semibold">{formatCurrency(invoice.totalAmount)}</span></p>
                  <p>Allocated: <span className="font-semibold">{formatCurrency(invoice.paidAmount)}</span></p>
                  <p>Balance: <span className="font-semibold">{formatCurrency(remaining)}</span></p>
                  <p>Status: <span className="font-semibold">{invoice.status}</span></p>
                </div>

                <div className="mt-2 h-2 rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${Math.min(100, (invoice.paidAmount / invoice.totalAmount) * 100)}%` }}
                  />
                </div>

                {payments.length > 0 && (
                  <div className="mt-4 border-t pt-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Settlement trail</p>
                    <div className="space-y-2">
                      {payments.map((payment) => (
                        <div key={payment.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm">
                          <span>{formatCurrency(payment.amount)} • {payment.paymentMethod}</span>
                          <span className="text-gray-500">
                            {new Date(payment.paymentDate).toLocaleDateString("en-IN")}
                            {payment.reference ? ` • Ref ${payment.reference}` : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          }) : <p className="text-gray-500">No invoices yet.</p>}
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Payment history</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-gray-500">
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Invoice</th>
                <th className="px-3 py-2">Method</th>
                <th className="px-3 py-2 text-right">Amount</th>
                <th className="px-3 py-2">Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {customer.paymentHistory?.length ? customer.paymentHistory.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-3 py-2">{new Date(payment.paymentDate).toLocaleDateString("en-IN")}</td>
                  <td className="px-3 py-2 font-medium">{payment.invoice?.invoiceNumber ?? payment.invoiceId.slice(0, 8)}</td>
                  <td className="px-3 py-2">{payment.paymentMethod}</td>
                  <td className="px-3 py-2 text-right font-semibold">{formatCurrency(payment.amount)}</td>
                  <td className="px-3 py-2 text-gray-500">{payment.reference || "—"}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-gray-500">No payment entries yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="mb-2 text-lg font-semibold">Reconciliation check</h2>
        <p className="text-sm text-gray-600">Stored outstanding: {formatCurrency(customer.outstandingAmount)}</p>
        <p className="text-sm text-gray-600">Calculated from invoices: {formatCurrency(computedOutstanding)}</p>
        <p className="mt-2 text-sm font-medium text-emerald-700">
          {Math.abs(customer.outstandingAmount - computedOutstanding) < 0.01 ? "Ledger matches invoice balances." : "Mismatch detected — review recent payments."}
        </p>
        <p className="mt-3 text-sm text-gray-600">Address: {customer.address || "Not provided"}</p>
        <p className="text-sm text-gray-600">GST: {customer.gstNumber || "Not provided"}</p>
      </div>
    </div>
  );
}

function Stat({ label, value, icon, tone = "neutral" }: { label: string; value: string; icon: React.ReactNode; tone?: "neutral" | "danger" }) {
  return (
    <div className={`rounded-2xl border p-4 ${tone === "danger" ? "border-red-200 bg-red-50" : "border-gray-200 bg-white"}`}>
      <div className="mb-3 flex items-center justify-between text-gray-500">
        <span className="text-sm">{label}</span>
        <span>{icon}</span>
      </div>
      <p className={`text-xl font-bold ${tone === "danger" ? "text-red-600" : "text-gray-900"}`}>{value}</p>
    </div>
  );
}
