import { jsPDF } from "jspdf";
import { businessInfo } from "@/lib/business-info";
import { formatCurrency } from "@/lib/invoice-utils";

export interface InvoicePdfData {
  invoiceNumber: string;
  invoiceDate: string;
  customerName: string;
  customerMobile: string;
  customerAddress: string;
  customerGst?: string | null;
  paymentType: string;
  gstEnabled: boolean;
  invoiceType: string;
  items: {
    name: string;
    marathiName?: string | null;
    quantity: number;
    rate: number;
    discountAmount: number;
    gstPercent: number;
    amount: number;
    unit: string;
  }[];
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  gstAmount: number;
  totalAmount: number;
  notes?: string | null;
}

export function generateInvoicePdf(data: InvoicePdfData): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 18;

  doc.setFillColor(15, 61, 46);
  doc.rect(0, 0, pageWidth, 42, "F");

  doc.setTextColor(212, 175, 55);
  doc.setFontSize(22);
  doc.text(businessInfo.name, pageWidth / 2, 14, { align: "center" });

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.text(businessInfo.tagline, pageWidth / 2, 22, { align: "center" });
  doc.setFontSize(9);
  doc.text(`Address: ${businessInfo.address}`, pageWidth / 2, 28, { align: "center" });
  doc.text(`Phone: ${businessInfo.phones.join(" | ")}`, pageWidth / 2, 34, { align: "center" });

  y = 52;
  doc.setTextColor(28, 28, 28);
  doc.setFontSize(14);
  doc.text(
    data.gstEnabled ? "TAX INVOICE" : "INVOICE",
    14,
    y
  );

  doc.setFontSize(10);
  y += 8;
  doc.text(`Invoice No: ${data.invoiceNumber}`, 14, y);
  doc.text(`Date: ${data.invoiceDate}`, pageWidth - 14, y, { align: "right" });
  y += 6;
  doc.text(`Payment: ${data.paymentType}`, 14, y);
  doc.text(`Type: ${data.invoiceType.replace("_", " ")}`, pageWidth - 14, y, { align: "right" });

  y += 10;
  doc.setFillColor(248, 244, 233);
  doc.rect(14, y - 4, pageWidth - 28, 18, "F");
  doc.setFontSize(10);
  doc.text("Bill To:", 16, y);
  y += 5;
  doc.setFont("helvetica", "bold");
  doc.text(data.customerName, 16, y);
  doc.setFont("helvetica", "normal");
  y += 5;
  doc.text(`${data.customerMobile} | ${data.customerAddress}`, 16, y);
  if (data.customerGst) {
    y += 5;
    doc.text(`GSTIN: ${data.customerGst}`, 16, y);
  }

  y += 12;
  const colX = [14, 70, 90, 108, 128, 148, 168];
  doc.setFillColor(15, 61, 46);
  doc.rect(14, y - 5, pageWidth - 28, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text("Product", colX[0], y);
  doc.text("Qty", colX[1], y);
  doc.text("Rate", colX[2], y);
  doc.text("Disc", colX[3], y);
  doc.text("GST%", colX[4], y);
  doc.text("Total", colX[5], y);

  y += 8;
  doc.setTextColor(28, 28, 28);

  data.items.forEach((item, index) => {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }

    const bg = index % 2 === 0 ? 252 : 248;
    doc.setFillColor(bg, bg, bg);
    doc.rect(14, y - 4, pageWidth - 28, 10, "F");

    const displayName = item.marathiName
      ? `${item.marathiName} (${item.name})`
      : item.name;

    doc.setFontSize(8);
    doc.text(displayName.substring(0, 38), colX[0], y);
    doc.text(`${item.quantity} ${item.unit}`, colX[1], y);
    doc.text(item.rate.toFixed(2), colX[2], y);
    doc.text(item.discountAmount.toFixed(2), colX[3], y);
    doc.text(data.gstEnabled ? `${item.gstPercent}%` : "-", colX[4], y);
    doc.text(item.amount.toFixed(2), colX[5], y);
    y += 10;
  });

  y += 4;
  const totalsX = pageWidth - 70;
  doc.setFontSize(10);
  doc.text(`Subtotal: ${formatCurrency(data.subtotal)}`, totalsX, y);
  y += 6;
  if (data.discountAmount > 0) {
    doc.text(`Invoice Discount: ${formatCurrency(data.discountAmount)}`, totalsX, y);
    y += 6;
  }
  if (data.gstEnabled) {
    doc.text(`GST: ${formatCurrency(data.gstAmount)}`, totalsX, y);
    y += 6;
  }
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 61, 46);
  doc.text(`Grand Total: ${formatCurrency(data.totalAmount)}`, totalsX, y);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(9);
  doc.text(businessInfo.footer, pageWidth / 2, 285, { align: "center" });

  return doc;
}

export function downloadInvoicePdf(data: InvoicePdfData, filename?: string) {
  const doc = generateInvoicePdf(data);
  doc.save(filename ?? `${data.invoiceNumber}.pdf`);
}

export function getInvoicePdfBlob(data: InvoicePdfData): Blob {
  const doc = generateInvoicePdf(data);
  return doc.output("blob");
}
