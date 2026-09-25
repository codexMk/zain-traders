"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, CircleDashed, IndianRupee, PackageCheck, Truck } from "lucide-react";
import { formatCurrency } from "@/lib/invoice-utils";

interface PurchaseItem {
  id: string;
  productName: string;
  quantity: number;
  rate: number;
  total: number;
}

interface PurchasePayment {
  id: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  reference?: string | null;
}

interface StockMovementRow {
  id: string;
  productName: string;
  quantity: number;
  quantityChange: number;
  balanceAfter: number | null;
  referenceType: string | null;
  createdAt: string;
}

interface PurchaseDetail {
  id: string;
  supplierId: string;
  purchaseNumber: string;
  supplierName: string;
  total: number;
  paidAmount: number;
  paymentStatus: string;
  isCompleted: boolean;
  items: PurchaseItem[];
  payments: PurchasePayment[];
  stockMovements: StockMovementRow[];
}

export default function PurchaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [purchase, setPurchase] = useState<PurchaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMethod: "BANK",
    reference: "",
  });
  const [paying, setPaying] = useState(false);

  const fetchPurchase = async (id: string) => {
    const response = await fetch(`/api/purchases/${id}`);
    const data = (await response.json()) as PurchaseDetail;
    setPurchase(data);
    setLoading(false);
  };

  useEffect(() => {
    const load = async () => {
      const resolved = await params;
      fetchPurchase(resolved.id);
    };

    load();
  }, [params]);

  const handleApprovalToggle = async () => {
    if (!purchase) return;
    setApproving(true);

    const response = await fetch(`/api/purchases/${purchase.id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved: !purchase.isCompleted }),
    });

    if (response.ok) {
      const resolved = await params;
      await fetchPurchase(resolved.id);
    }

    setApproving(false);
  };

  const handleSupplierPayment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!purchase) return;

    setPaying(true);
    try {
      const response = await fetch(`/api/suppliers/${purchase.supplierId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purchaseId: purchase.id,
          amount: Number(paymentForm.amount),
          paymentDate: paymentForm.paymentDate,
          paymentMethod: paymentForm.paymentMethod,
          reference: paymentForm.reference || undefined,
        }),
      });

      if (response.ok) {
        const resolved = await params;
        await fetchPurchase(resolved.id);
        setPaymentForm((prev) => ({ ...prev, amount: "", reference: "" }));
      }
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <div className="p-8 text-gray-600">Loading purchase...</div>;
  if (!purchase) return <div className="p-8 text-red-600">Purchase not found.</div>;

  const totalPaid = purchase.paidAmount ?? (purchase.payments || []).reduce((sum, payment) => sum + payment.amount, 0);
  const remaining = purchase.total - totalPaid;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/purchases" className="inline-flex items-center gap-2 text-sm text-brand-emerald">
            <ArrowLeft size={16} /> Back
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{purchase.purchaseNumber}</h1>
            <p className="text-gray-600">Supplier: {purchase.supplierName}</p>
          </div>
        </div>

        <button
          onClick={handleApprovalToggle}
          disabled={approving}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 font-semibold text-white ${purchase.isCompleted ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700"}`}
        >
          {purchase.isCompleted ? <CircleDashed size={18} /> : <CheckCircle2 size={18} />}
          {approving ? "Updating..." : purchase.isCompleted ? "Revert to pending" : "Confirm receipt & approve"}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Stat label="Total amount" value={formatCurrency(purchase.total)} icon={<IndianRupee size={18} />} />
        <Stat label="Paid" value={formatCurrency(totalPaid)} icon={<PackageCheck size={18} />} />
        <Stat label="Remaining" value={formatCurrency(remaining)} icon={<IndianRupee size={18} />} tone={remaining > 0 ? "warning" : "success"} />
        <Stat label="Receipt" value={purchase.isCompleted ? "Confirmed" : "Pending"} icon={<Truck size={18} />} tone={purchase.isCompleted ? "success" : "warning"} />
        <Stat label="Payment" value={purchase.paymentStatus.replace("_", " ")} icon={<CheckCircle2 size={18} />} tone={remaining > 0 ? "warning" : "success"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Purchase items</h2>
          <div className="space-y-3">
            {(purchase.items || []).map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-xl border p-3">
                <div>
                  <p className="font-medium">{item.productName}</p>
                  <p className="text-xs text-gray-500">{item.quantity} qty • {formatCurrency(item.rate)}</p>
                </div>
                <p className="font-semibold">{formatCurrency(item.total)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <form onSubmit={handleSupplierPayment} className="rounded-2xl border bg-white p-5 shadow-sm space-y-3">
            <h2 className="text-lg font-semibold">Link supplier payment</h2>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Amount"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm((prev) => ({ ...prev, amount: e.target.value }))}
              className="w-full rounded-xl border px-3 py-2"
              required
            />
            <input
              type="date"
              value={paymentForm.paymentDate}
              onChange={(e) => setPaymentForm((prev) => ({ ...prev, paymentDate: e.target.value }))}
              className="w-full rounded-xl border px-3 py-2"
            />
            <select
              value={paymentForm.paymentMethod}
              onChange={(e) => setPaymentForm((prev) => ({ ...prev, paymentMethod: e.target.value }))}
              className="w-full rounded-xl border px-3 py-2"
            >
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
              <option value="BANK">Bank</option>
            </select>
            <input
              placeholder="Reference / UTR"
              value={paymentForm.reference}
              onChange={(e) => setPaymentForm((prev) => ({ ...prev, reference: e.target.value }))}
              className="w-full rounded-xl border px-3 py-2"
            />
            <button type="submit" disabled={paying || remaining <= 0} className="w-full rounded-xl bg-amber-500 py-2 font-semibold text-white disabled:opacity-50">
              {paying ? "Saving..." : "Record payment"}
            </button>
          </form>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Payment activity</h2>
            <div className="space-y-3">
              {(purchase.payments || []).length ? (purchase.payments || []).map((payment) => (
                <div key={payment.id} className="rounded-xl border p-3">
                  <p className="font-medium">{formatCurrency(payment.amount)}</p>
                  <p className="text-xs text-gray-500">{payment.paymentMethod} • {new Date(payment.paymentDate).toLocaleDateString("en-IN")}</p>
                </div>
              )) : <p className="text-gray-500">No payments recorded yet.</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Inventory impact</h2>
        {!purchase.isCompleted && (
          <p className="mb-3 text-sm text-amber-700">Stock will post to inventory when this purchase is approved and receipt is confirmed.</p>
        )}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-gray-500">
                <th className="px-3 py-2">Product</th>
                <th className="px-3 py-2 text-right">Qty change</th>
                <th className="px-3 py-2 text-right">Balance after</th>
                <th className="px-3 py-2">Event</th>
                <th className="px-3 py-2">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(purchase.stockMovements || []).length ? purchase.stockMovements.map((movement) => (
                <tr key={movement.id}>
                  <td className="px-3 py-2">{movement.productName}</td>
                  <td className="px-3 py-2 text-right">{movement.quantityChange > 0 ? `+${movement.quantityChange}` : movement.quantityChange}</td>
                  <td className="px-3 py-2 text-right">{movement.balanceAfter ?? "—"}</td>
                  <td className="px-3 py-2">{movement.referenceType ?? "—"}</td>
                  <td className="px-3 py-2">{new Date(movement.createdAt).toLocaleDateString("en-IN")}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-gray-500">No stock movements linked yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, icon, tone = "neutral" }: { label: string; value: string; icon: React.ReactNode; tone?: "neutral" | "warning" | "success" }) {
  const styles = {
    neutral: "border-gray-200 bg-white text-gray-900",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  }[tone];

  return (
    <div className={`rounded-2xl border p-4 ${styles}`}>
      <div className="mb-3 flex items-center justify-between text-gray-500">
        <span className="text-sm">{label}</span>
        <span>{icon}</span>
      </div>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}
