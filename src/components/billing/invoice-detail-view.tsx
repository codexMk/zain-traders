"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Copy, Download, MessageCircle, Printer, RotateCcw, XCircle } from "lucide-react";
import { amountInWords, formatCurrency } from "@/lib/invoice-utils";
import { businessInfo } from "@/lib/business-info";
import { downloadInvoicePdf, type InvoicePdfData } from "@/lib/pdf/invoice-pdf";
import { permissions } from "@/lib/permissions";
import { useSession } from "next-auth/react";

type Payment = {
  id: string; amount: number; paymentDate: string; paymentMethod: string; reference?: string | null;
  reversedAt?: string | null; reversalReason?: string | null;
};
type InvoiceDetail = {
  id: string; invoiceNumber: string; invoiceDate: string; invoiceType: string; paymentType: string;
  gstEnabled: boolean; status: string; subtotal: number; discountAmount: number; taxableAmount: number;
  gstAmount: number; cgstAmount: number; sgstAmount: number; igstAmount: number; totalAmount: number;
  paidAmount: number; deliveryBy?: string | null; notes?: string | null; cancellationReason?: string | null;
  customerName: string; customerMobile?: string | null; customerAddress: string; customerGstNumber?: string | null;
  placeOfSupplyStateCode?: string | null; supplierName: string; supplierAddress: string; supplierGstin?: string | null;
  supplierPhones: string[];
  payments: Payment[];
  items: { productName: string; productSku?: string | null; hsnCode?: string | null; unit: string; quantity: number; rate: number; discountAmount: number; gstPercent: number; amount: number; lineSubtotal: number; taxableAmount: number; cgstAmount: number; sgstAmount: number; igstAmount: number; product?: { name: string; marathiName?: string | null; unit: string } | null }[];
};
type PrintFormat = "A4" | "THERMAL_58" | "THERMAL_80";

const fmtDate = (value: string) => new Date(value).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });

export default function InvoiceDetailView({ invoiceId }: { invoiceId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [printFormat, setPrintFormat] = useState<PrintFormat>("A4");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState<"CASH" | "UPI">("CASH");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [draftAmountReceived, setDraftAmountReceived] = useState("");
  const [draftPaymentMode, setDraftPaymentMode] = useState<"CASH" | "UPI">("CASH");
  const role = session?.user?.role ?? "STAFF";
  const canCancel = permissions.canDeleteInvoices(role);
  const canReversePayments = role === "OWNER";

  const fetchInvoice = useCallback(() => {
    setLoading(true);
    fetch(`/api/invoices/${invoiceId}`)
      .then((response) => { if (!response.ok) throw new Error("Invoice not found"); return response.json(); })
      .then(setInvoice)
      .catch(() => setError("Invoice not found"))
      .finally(() => setLoading(false));
  }, [invoiceId]);

  useEffect(() => fetchInvoice(), [fetchInvoice]);

  useEffect(() => {
    if (searchParams.get("print")) {
      const format = searchParams.get("print") === "THERMAL_58" ? "THERMAL_58" : searchParams.get("print") === "THERMAL_80" ? "THERMAL_80" : "A4";
      setPrintFormat(format);
      const timeout = setTimeout(() => handlePrint(format), 250);
      return () => clearTimeout(timeout);
    }
  // Print once when the saved invoice loads.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, invoice?.id]);

  const handlePrint = (format = printFormat) => {
    document.documentElement.dataset.printFormat = format;
    window.print();
    window.setTimeout(() => { delete document.documentElement.dataset.printFormat; }, 1000);
  };

  const getPdfData = (): InvoicePdfData | null => {
    if (!invoice) return null;
    return {
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: fmtDate(invoice.invoiceDate),
      customerName: invoice.customerName || "Walk-in Customer",
      customerMobile: invoice.customerMobile ?? "",
      customerAddress: invoice.customerAddress,
      customerGst: invoice.customerGstNumber,
      supplierName: invoice.supplierName || businessInfo.nameEnglish,
      supplierAddress: invoice.supplierAddress || businessInfo.address,
      supplierGstin: invoice.supplierGstin,
      supplierPhones: invoice.supplierPhones.length ? invoice.supplierPhones : [...businessInfo.phones],
      paymentType: invoice.paymentType,
      paymentStatus: invoice.status,
      gstEnabled: invoice.gstEnabled,
      invoiceType: invoice.invoiceType,
      placeOfSupplyStateCode: invoice.placeOfSupplyStateCode,
      items: invoice.items.map((item) => ({
        name: item.productName || item.product?.name || "Item",
        hsnCode: item.hsnCode,
        quantity: item.quantity,
        rate: item.rate,
        discountAmount: item.discountAmount,
        gstPercent: item.gstPercent,
        amount: item.amount,
        unit: item.unit || item.product?.unit || "",
        taxableAmount: item.taxableAmount,
        cgstAmount: item.cgstAmount,
        sgstAmount: item.sgstAmount,
        igstAmount: item.igstAmount,
      })),
      subtotal: invoice.subtotal,
      discountAmount: invoice.discountAmount,
      taxableAmount: invoice.taxableAmount,
      gstAmount: invoice.gstAmount,
      cgstAmount: invoice.cgstAmount,
      sgstAmount: invoice.sgstAmount,
      igstAmount: invoice.igstAmount,
      totalAmount: invoice.totalAmount,
      paidAmount: invoice.paidAmount,
      balanceDue: Math.max(0, invoice.totalAmount - invoice.paidAmount),
      deliveryBy: invoice.deliveryBy,
      notes: invoice.notes,
    };
  };

  const handleDownload = () => { const data = getPdfData(); if (data) downloadInvoicePdf(data); };
  const handleWhatsApp = () => {
    if (!invoice) return;
    const message = encodeURIComponent(`${invoice.supplierName || businessInfo.nameEnglish}\nInvoice: ${invoice.invoiceNumber}\nCustomer: ${invoice.customerName}\nTotal: ${formatCurrency(invoice.totalAmount)}\nBalance due: ${formatCurrency(Math.max(0, invoice.totalAmount - invoice.paidAmount))}`);
    const mobile = (invoice.customerMobile ?? "").replace(/\D/g, "");
    window.open(`https://wa.me/${mobile ? `91${mobile.slice(-10)}` : ""}?text=${message}`, "_blank", "noopener,noreferrer");
  };

  const handleDuplicate = async () => {
    const response = await fetch(`/api/invoices/${invoiceId}?action=duplicate`, { method: "POST" });
    const result = await response.json();
    if (response.ok) router.push(`/dashboard/billing/${result.id}`);
    else setError(result.error || "Could not duplicate invoice");
  };

  const handleCancel = async () => {
    const reason = window.prompt("Reason for cancelling this invoice:", "Cancelled by owner");
    if (!reason?.trim()) return;
    const response = await fetch(`/api/invoices/${invoiceId}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason }) });
    const result = await response.json();
    if (response.ok) fetchInvoice(); else setError(result.error || "Could not cancel invoice");
  };

  const recordPayment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!paymentAmount || paymentBusy) return;
    setPaymentBusy(true);
    const response = await fetch(`/api/invoices/${invoiceId}/payments`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: Number(paymentAmount), paymentDate: new Date().toISOString(), paymentMethod: paymentMode, reference: paymentReference || undefined, idempotencyKey: crypto.randomUUID() }),
    });
    const result = await response.json();
    if (response.ok) { setPaymentAmount(""); setPaymentReference(""); fetchInvoice(); }
    else setError(result.error || "Could not record payment");
    setPaymentBusy(false);
  };

  const finalizeDraft = async (event: React.FormEvent) => {
    event.preventDefault();
    if (paymentBusy) return;
    setPaymentBusy(true);
    setError("");
    const response = await fetch(`/api/invoices/${invoiceId}?action=finalize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountReceived: Number(draftAmountReceived || 0), paymentType: draftPaymentMode, paymentDate: new Date().toISOString() }),
    });
    const result = await response.json();
    if (response.ok) { setDraftAmountReceived(""); fetchInvoice(); }
    else setError(result.error || "Could not finalize draft");
    setPaymentBusy(false);
  };

  const reversePayment = async (payment: Payment) => {
    const reason = window.prompt("Reason for reversing this payment:");
    if (!reason?.trim()) return;
    const response = await fetch(`/api/invoices/${invoiceId}/payments/${payment.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason }) });
    const result = await response.json();
    if (response.ok) fetchInvoice(); else setError(result.error || "Could not reverse payment");
  };

  if (loading) return <div className="py-20 text-center text-brand-muted">Loading invoice…</div>;
  if (error && !invoice) return <div className="py-20 text-center text-red-600">{error}</div>;
  if (!invoice) return null;

  const paidAmount = invoice.payments.filter((payment) => !payment.reversedAt).reduce((sum, payment) => sum + payment.amount, 0);
  const due = Math.max(0, invoice.totalAmount - paidAmount);
  const taxSplitKnown = invoice.igstAmount > 0 || invoice.cgstAmount > 0 || invoice.sgstAmount > 0;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-3"><Link href="/dashboard/billing" className="text-brand-muted"><ChevronLeft size={26} /></Link><div><h1 className="text-2xl font-bold">{invoice.invoiceNumber}</h1><p className="text-sm text-brand-muted">{invoice.status} · {fmtDate(invoice.invoiceDate)}</p></div></div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={printFormat} onChange={(e) => setPrintFormat(e.target.value as PrintFormat)} className="rounded-xl border bg-white px-3 py-2 text-sm"><option value="A4">A4 Invoice</option><option value="THERMAL_58">58 mm Receipt</option><option value="THERMAL_80">80 mm Receipt</option></select>
          <button onClick={() => handlePrint()} className="flex items-center gap-2 rounded-xl border px-3 py-2"><Printer size={17} />Print</button>
          <button onClick={handleDownload} className="flex items-center gap-2 rounded-xl bg-brand-emerald px-3 py-2 text-white"><Download size={17} />PDF</button>
          <button onClick={handleWhatsApp} className="flex items-center gap-2 rounded-xl bg-green-600 px-3 py-2 text-white"><MessageCircle size={17} />WhatsApp</button>
          <button onClick={handleDuplicate} className="flex items-center gap-2 rounded-xl bg-brand-gold px-3 py-2"><Copy size={17} />Duplicate</button>
          {canCancel && invoice.status !== "CANCELLED" && <button onClick={handleCancel} className="flex items-center gap-2 rounded-xl bg-red-600 px-3 py-2 text-white"><XCircle size={17} />Cancel invoice</button>}
        </div>
      </div>
      {error && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 print:hidden">{error}</div>}

      <article id="invoice-a4" className="invoice-document invoice-a4 mx-auto max-w-[210mm] bg-white p-8 shadow-lg print:shadow-none">
        <header className="border-b-2 border-emerald-900 pb-4">
          <div className="flex items-start justify-between gap-4"><div><p className="text-2xl font-bold text-emerald-950">{invoice.supplierName || businessInfo.nameEnglish} <span className="text-base">/ ज़ैन ट्रेडर्स</span></p><p className="mt-1 text-sm text-gray-600">Wholesale spices and dry fruits</p><p className="mt-2 max-w-lg text-sm">{invoice.supplierAddress || businessInfo.address}</p><p className="text-sm">{invoice.supplierPhones.length ? invoice.supplierPhones.join(" · ") : businessInfo.phones.join(" · ")}</p>{invoice.supplierGstin && <p className="mt-1 text-sm font-semibold">GSTIN: {invoice.supplierGstin}</p>}</div><div className="text-right"><p className="text-xl font-bold text-emerald-900">{invoice.gstEnabled ? "TAX INVOICE" : "BILL"}</p><p className="mt-2 text-sm">Invoice No: <b>{invoice.invoiceNumber}</b></p><p className="text-sm">Date: {fmtDate(invoice.invoiceDate)}</p>{invoice.placeOfSupplyStateCode && <p className="text-sm">Place of supply: {invoice.placeOfSupplyStateCode}</p>}<p className="mt-1 text-sm">Payment status: <b>{invoice.status}</b></p></div></div>
        </header>
        <section className="my-5 grid grid-cols-2 gap-6 text-sm"><div><p className="mb-1 text-xs font-bold uppercase tracking-wide text-gray-500">Bill to</p><p className="font-bold">{invoice.customerName || "Walk-in Customer"}</p>{invoice.customerMobile && <p>{invoice.customerMobile}</p>}{invoice.customerAddress && <p className="whitespace-pre-wrap">{invoice.customerAddress}</p>}{invoice.customerGstNumber && <p className="mt-1">GSTIN: {invoice.customerGstNumber}</p>}</div><div className="text-right"><p>Terms: {invoice.paymentType}</p>{invoice.deliveryBy && <p>Delivery by: {invoice.deliveryBy}</p>}</div></section>
        <table className="invoice-table w-full border-collapse text-xs"><thead className="table-header-group"><tr className="border-y bg-gray-100"><th className="px-2 py-2 text-left">Description</th><th className="px-2 py-2 text-left">HSN/SAC</th><th className="px-2 py-2 text-right">Qty</th><th className="px-2 py-2 text-right">Rate</th><th className="px-2 py-2 text-right">Discount</th><th className="px-2 py-2 text-right">Taxable</th>{invoice.gstEnabled && <th className="px-2 py-2 text-right">GST</th>}<th className="px-2 py-2 text-right">Amount</th></tr></thead><tbody>{invoice.items.map((item, index) => <tr key={`${item.productSku}-${index}`} className="invoice-row border-b align-top"><td className="px-2 py-2">{item.productName || item.product?.name || "Item"}</td><td className="px-2 py-2">{item.hsnCode || "—"}</td><td className="px-2 py-2 text-right">{item.quantity} {item.unit}</td><td className="px-2 py-2 text-right">{formatCurrency(item.rate)}</td><td className="px-2 py-2 text-right">{formatCurrency(item.discountAmount)}</td><td className="px-2 py-2 text-right">{formatCurrency(item.taxableAmount)}</td>{invoice.gstEnabled && <td className="px-2 py-2 text-right">{item.gstPercent}%</td>}<td className="px-2 py-2 text-right font-semibold">{formatCurrency(item.amount)}</td></tr>)}</tbody></table>
        <div className="mt-5 flex justify-end"><div className="w-72 space-y-1.5 text-sm"><div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(invoice.subtotal)}</span></div><div className="flex justify-between"><span>Discount</span><span>−{formatCurrency(invoice.discountAmount)}</span></div><div className="flex justify-between"><span>Taxable amount</span><span>{formatCurrency(invoice.taxableAmount)}</span></div>{invoice.gstEnabled && (taxSplitKnown ? invoice.igstAmount > 0 ? <div className="flex justify-between"><span>IGST</span><span>{formatCurrency(invoice.igstAmount)}</span></div> : <><div className="flex justify-between"><span>CGST</span><span>{formatCurrency(invoice.cgstAmount)}</span></div><div className="flex justify-between"><span>SGST</span><span>{formatCurrency(invoice.sgstAmount)}</span></div></> : <div className="flex justify-between"><span>GST</span><span>{formatCurrency(invoice.gstAmount)}</span></div>)}<div className="flex justify-between border-t border-gray-400 pt-2 text-lg font-bold"><span>Grand total</span><span>{formatCurrency(invoice.totalAmount)}</span></div><p className="pt-1 text-xs text-gray-600">Amount in words: {amountInWords(invoice.totalAmount)}</p><div className="flex justify-between"><span>Amount received</span><span>{formatCurrency(paidAmount)}</span></div><div className="flex justify-between font-semibold"><span>Balance due</span><span>{formatCurrency(due)}</span></div></div></div>
        {invoice.notes && <p className="mt-5 text-sm">Notes: {invoice.notes}</p>}
        {invoice.status === "CANCELLED" && <p className="mt-5 rounded border border-red-300 p-3 text-sm font-bold text-red-700">CANCELLED — {invoice.cancellationReason}</p>}
        <footer className="mt-10 flex justify-between border-t pt-4 text-xs text-gray-500"><span>Authorized signature</span><span>Thank you for your business</span></footer>
      </article>

      <article id="invoice-thermal" className={`invoice-document invoice-thermal thermal-${printFormat === "THERMAL_58" ? "58" : "80"} mx-auto my-8 hidden rounded border bg-white p-3 text-xs shadow-sm`}>
        <header className="text-center"><h2 className="text-base font-bold">{invoice.supplierName || businessInfo.nameEnglish}</h2><p>ज़ैन ट्रेडर्स</p><p>{invoice.supplierPhones.length ? invoice.supplierPhones.join(" · ") : businessInfo.phones.join(" · ")}</p>{invoice.supplierGstin && <p>GSTIN: {invoice.supplierGstin}</p>}<hr className="my-2 border-dashed border-gray-500" /><p className="font-bold">{invoice.gstEnabled ? "TAX INVOICE" : "RECEIPT"}</p><p>{invoice.invoiceNumber} · {fmtDate(invoice.invoiceDate)}</p>{invoice.customerName && <p>Customer: {invoice.customerName}</p>}</header>
        <hr className="my-2 border-dashed border-gray-500" />
        <div className="space-y-2">{invoice.items.map((item, index) => <div key={`${item.productSku}-${index}`} className="thermal-item"><div className="break-words font-semibold">{item.productName || item.product?.name || "Item"}</div><div className="thermal-columns"><span>{item.quantity} {item.unit} × {formatCurrency(item.rate)}</span><span>{formatCurrency(item.amount)}</span></div>{item.discountAmount > 0 && <div className="thermal-columns text-gray-600"><span>Discount</span><span>−{formatCurrency(item.discountAmount)}</span></div>}</div>)}</div>
        <hr className="my-2 border-dashed border-gray-500" />
        <div className="space-y-1"><div className="thermal-columns"><span>Subtotal</span><span>{formatCurrency(invoice.subtotal)}</span></div>{invoice.discountAmount > 0 && <div className="thermal-columns"><span>Discount</span><span>−{formatCurrency(invoice.discountAmount)}</span></div>}{invoice.gstEnabled && <div className="thermal-columns"><span>{invoice.igstAmount > 0 ? "IGST" : "CGST + SGST"}</span><span>{formatCurrency(invoice.gstAmount)}</span></div>}<div className="thermal-columns border-t border-gray-500 pt-1 text-sm font-bold"><span>TOTAL</span><span>{formatCurrency(invoice.totalAmount)}</span></div><div className="thermal-columns"><span>Paid</span><span>{formatCurrency(paidAmount)}</span></div><div className="thermal-columns font-semibold"><span>Due</span><span>{formatCurrency(due)}</span></div><p className="pt-2 text-center">Paid by {invoice.paymentType}</p><p className="text-center">Thank you. Visit again!</p></div>
      </article>

      <section className="mt-6 grid gap-5 lg:grid-cols-2 print:hidden">
        <div className="rounded-2xl border bg-white p-5"><h2 className="mb-3 font-semibold">Recorded payments</h2>{invoice.status === "DRAFT" && <form onSubmit={finalizeDraft} className="mb-4 rounded-xl bg-brand-cream/60 p-3"><p className="mb-2 text-sm font-semibold">Finalize this draft</p><div className="grid gap-2 sm:grid-cols-2"><input aria-label="Initial amount received" type="number" min="0" step="0.01" max={invoice.totalAmount} value={draftAmountReceived} onChange={(e) => setDraftAmountReceived(e.target.value)} placeholder="Amount received (0 for unpaid)" className="rounded-lg border px-3 py-2" /><select value={draftPaymentMode} onChange={(e) => setDraftPaymentMode(e.target.value as "CASH" | "UPI")} className="rounded-lg border bg-white px-3 py-2"><option value="CASH">Cash</option><option value="UPI">UPI</option></select><button disabled={paymentBusy} className="rounded-lg bg-brand-emerald px-3 py-2 font-semibold text-white disabled:opacity-50 sm:col-span-2">{paymentBusy ? "Finalizing…" : "Finalize bill and post stock"}</button></div></form>}{invoice.payments.length ? <div className="space-y-2">{invoice.payments.map((payment) => <div key={payment.id} className="flex flex-wrap items-center justify-between gap-2 border-b pb-2 text-sm"><span>{fmtDate(payment.paymentDate)} · {payment.paymentMethod}{payment.reference ? ` · ${payment.reference}` : ""}{payment.reversedAt && <span className="ml-2 text-red-600">Reversed: {payment.reversalReason}</span>}</span><span className="flex items-center gap-2 font-semibold">{formatCurrency(payment.amount)}{canReversePayments && !payment.reversedAt && invoice.status !== "CANCELLED" && <button type="button" onClick={() => void reversePayment(payment)} className="rounded p-1 text-red-600" title="Reverse payment"><RotateCcw size={16} /></button>}</span></div>)}</div> : <p className="text-sm text-brand-muted">No payments recorded.</p>}{invoice.customerName && invoice.status !== "DRAFT" && invoice.status !== "CANCELLED" && due > 0 && <form onSubmit={recordPayment} className="mt-4 grid gap-2 sm:grid-cols-2"><input aria-label="Payment amount" type="number" min="0.01" step="0.01" max={due} required value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder="Amount" className="rounded-lg border px-3 py-2" /><select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value as "CASH" | "UPI")} className="rounded-lg border bg-white px-3 py-2"><option value="CASH">Cash</option><option value="UPI">UPI</option></select><input value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} placeholder="Reference (optional)" className="rounded-lg border px-3 py-2" /><button disabled={paymentBusy} className="rounded-lg bg-brand-emerald px-3 py-2 font-semibold text-white disabled:opacity-50">{paymentBusy ? "Recording…" : "Record payment"}</button></form>}</div><div className="rounded-2xl border bg-white p-5"><h2 className="mb-2 font-semibold">Print format</h2><p className="mb-3 text-sm text-brand-muted">Print uses this saved invoice for A4 or compact 58 mm / 80 mm thermal paper.</p><button onClick={() => handlePrint()} className="rounded-lg border px-4 py-2">Print selected format</button></div>
      </section>
    </div>
  );
}
