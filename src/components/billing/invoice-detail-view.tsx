"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Printer,
  Download,
  MessageCircle,
  Copy,
  Trash2,
} from "lucide-react";
import { businessInfo } from "@/lib/business-info";
import { formatCurrency } from "@/lib/invoice-utils";
import { downloadInvoicePdf } from "@/lib/pdf/invoice-pdf";
import { permissions } from "@/lib/permissions";
import { useSession } from "next-auth/react";

interface InvoiceDetail {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  invoiceType: string;
  paymentType: string;
  gstEnabled: boolean;
  status: string;
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  gstAmount: number;
  totalAmount: number;
  notes?: string | null;
  customer: {
    name: string;
    mobile: string;
    address: string;
    gstNumber?: string | null;
  };
  items: {
    quantity: number;
    rate: number;
    discountAmount: number;
    gstPercent: number;
    amount: number;
    product: {
      name: string;
      marathiName?: string | null;
      unit: string;
    };
  }[];
}

export default function InvoiceDetailView({ invoiceId }: { invoiceId: string }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const role = session?.user?.role ?? "STAFF";
  const canDelete = permissions.canDeleteInvoices(role);

  useEffect(() => {
    fetch(`/api/invoices/${invoiceId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then(setInvoice)
      .catch(() => setError("Invoice not found"))
      .finally(() => setLoading(false));
  }, [invoiceId]);

  const getPdfData = () => {
    if (!invoice) return null;
    return {
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: new Date(invoice.invoiceDate).toLocaleDateString("en-IN"),
      customerName: invoice.customer.name,
      customerMobile: invoice.customer.mobile,
      customerAddress: invoice.customer.address,
      customerGst: invoice.customer.gstNumber,
      paymentType: invoice.paymentType,
      gstEnabled: invoice.gstEnabled,
      invoiceType: invoice.invoiceType,
      items: invoice.items.map((item) => ({
        name: item.product.name,
        marathiName: item.product.marathiName,
        quantity: item.quantity,
        rate: item.rate,
        discountAmount: item.discountAmount,
        gstPercent: item.gstPercent,
        amount: item.amount,
        unit: item.product.unit,
      })),
      subtotal: invoice.subtotal,
      discountAmount: invoice.discountAmount,
      taxableAmount: invoice.taxableAmount,
      gstAmount: invoice.gstAmount,
      totalAmount: invoice.totalAmount,
      notes: invoice.notes,
    };
  };

  const handlePrint = () => window.print();
  const handleDownload = () => {
    const data = getPdfData();
    if (data) downloadInvoicePdf(data);
  };

  const handleWhatsApp = () => {
    if (!invoice) return;
    const text = encodeURIComponent(
      `${businessInfo.name}\nInvoice: ${invoice.invoiceNumber}\nCustomer: ${invoice.customer.name}\nTotal: ${formatCurrency(invoice.totalAmount)}\n${businessInfo.phones[0]}`
    );
    window.open(`https://wa.me/91${invoice.customer.mobile}?text=${text}`, "_blank");
  };

  const handleDuplicate = async () => {
    const res = await fetch(`/api/invoices/${invoiceId}?action=duplicate`, {
      method: "POST",
    });
    const data = await res.json();
    if (res.ok) router.push(`/dashboard/billing/${data.id}`);
  };

  const handleDelete = async () => {
    if (!confirm("Delete this invoice? Stock will be restored.")) return;
    const res = await fetch(`/api/invoices/${invoiceId}`, { method: "DELETE" });
    if (res.ok) router.push("/dashboard/billing");
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-emerald/20 border-r-brand-emerald" />
      </div>
    );
  }

  if (error || !invoice) {
    return <div className="text-center py-20 text-red-600">{error}</div>;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 print:hidden">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/billing" className="text-gray-600">
            <ChevronLeft size={28} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{invoice.invoiceNumber}</h1>
            <p className="text-brand-muted text-sm">{invoice.status}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-white border rounded-xl hover:bg-brand-cream">
            <Printer size={18} /> Print
          </button>
          <button onClick={handleDownload} className="flex items-center gap-2 px-4 py-2 bg-brand-emerald text-white rounded-xl hover:opacity-90">
            <Download size={18} /> PDF
          </button>
          <button onClick={handleWhatsApp} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:opacity-90">
            <MessageCircle size={18} /> WhatsApp
          </button>
          <button onClick={handleDuplicate} className="flex items-center gap-2 px-4 py-2 bg-brand-gold text-brand-charcoal rounded-xl hover:opacity-90">
            <Copy size={18} /> Duplicate
          </button>
          {canDelete && (
            <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:opacity-90">
              <Trash2 size={18} /> Delete
            </button>
          )}
        </div>
      </div>

      <div id="invoice-print" className="bg-white rounded-2xl shadow-lg border border-brand-gold/30 overflow-hidden max-w-3xl mx-auto">
        <div className="bg-brand-emerald text-white p-8 text-center">
          <h2 className="text-3xl font-bold text-brand-gold">{businessInfo.name}</h2>
          <p className="mt-1">{businessInfo.tagline}</p>
          <p className="text-sm mt-3 opacity-90">{businessInfo.address}</p>
          <p className="text-sm">{businessInfo.phones.join(" | ")}</p>
        </div>

        <div className="p-8">
          <div className="flex justify-between mb-6">
            <div>
              <p className="text-xs text-brand-muted uppercase tracking-wide">Bill To</p>
              <p className="font-bold text-lg">{invoice.customer.name}</p>
              <p className="text-sm">{invoice.customer.mobile}</p>
              <p className="text-sm">{invoice.customer.address}</p>
              {invoice.customer.gstNumber && (
                <p className="text-sm">GSTIN: {invoice.customer.gstNumber}</p>
              )}
            </div>
            <div className="text-right">
              <p className="font-bold text-brand-emerald text-lg">
                {invoice.gstEnabled ? "TAX INVOICE" : "INVOICE"}
              </p>
              <p className="text-sm">No: {invoice.invoiceNumber}</p>
              <p className="text-sm">
                Date: {new Date(invoice.invoiceDate).toLocaleDateString("en-IN")}
              </p>
              <p className="text-sm">Payment: {invoice.paymentType}</p>
            </div>
          </div>

          <table className="w-full text-sm mb-6">
            <thead>
              <tr className="bg-brand-cream">
                <th className="px-3 py-2 text-left">Product</th>
                <th className="px-3 py-2 text-right">Qty</th>
                <th className="px-3 py-2 text-right">Rate</th>
                <th className="px-3 py-2 text-right">Disc</th>
                {invoice.gstEnabled && <th className="px-3 py-2 text-right">GST</th>}
                <th className="px-3 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, i) => (
                <tr key={i} className="border-b">
                  <td className="px-3 py-2">
                    {item.product.marathiName
                      ? `${item.product.marathiName} (${item.product.name})`
                      : item.product.name}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {item.quantity} {item.product.unit}
                  </td>
                  <td className="px-3 py-2 text-right">{item.rate.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">{item.discountAmount.toFixed(2)}</td>
                  {invoice.gstEnabled && (
                    <td className="px-3 py-2 text-right">{item.gstPercent}%</td>
                  )}
                  <td className="px-3 py-2 text-right font-medium">
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              {invoice.discountAmount > 0 && (
                <div className="flex justify-between">
                  <span>Discount</span>
                  <span>-{formatCurrency(invoice.discountAmount)}</span>
                </div>
              )}
              {invoice.gstEnabled && (
                <div className="flex justify-between">
                  <span>GST</span>
                  <span>{formatCurrency(invoice.gstAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold text-brand-emerald border-t pt-2">
                <span>Grand Total</span>
                <span>{formatCurrency(invoice.totalAmount)}</span>
              </div>
            </div>
          </div>

          {invoice.notes && (
            <p className="mt-4 text-sm text-brand-muted">Note: {invoice.notes}</p>
          )}
        </div>

        <div className="bg-brand-cream text-center py-4 text-brand-emerald font-medium">
          {businessInfo.footer}
        </div>
      </div>
    </div>
  );
}
