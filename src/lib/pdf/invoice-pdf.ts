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
  deliveryBy?: string | null;
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
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  const wrapText = (value: string, maxWidth: number, maxLines = 2) => {
    const lines = doc.splitTextToSize(value || "", maxWidth);
    return lines.slice(0, maxLines);
  };

  const drawHeader = () => {
    doc.setFillColor(15, 61, 46);
    doc.rect(0, 0, pageWidth, 42, "F");

    doc.setFillColor(255, 255, 255);
    doc.roundedRect(14, 7, 18, 18, 3, 3, "F");
    doc.setTextColor(15, 61, 46);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("ZT", 23, 19, { align: "center" });

    doc.setTextColor(212, 175, 55);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(businessInfo.nameEnglish || businessInfo.name, pageWidth / 2 + 6, 15, { align: "center" });

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(businessInfo.tagline, pageWidth / 2 + 6, 22, { align: "center" });
    doc.setFontSize(7.2);
    doc.text(`Address: ${businessInfo.address}`, pageWidth / 2 + 6, 28, { align: "center" });
    doc.text(`Phone: ${businessInfo.phones.join(" | ")}`, pageWidth / 2 + 6, 33, { align: "center" });
  };

  const drawProductHeader = (tableTop: number) => {
    doc.setFillColor(15, 61, 46);
    doc.rect(margin, tableTop, contentWidth, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);

    const columns = [
      { x: margin + 2, label: "Product", width: 78 },
      { x: margin + 80, label: "Qty", width: 18 },
      { x: margin + 99, label: "Rate", width: 24 },
      { x: margin + 124, label: "Disc", width: 20 },
      { x: margin + 145, label: "GST%", width: 16 },
      { x: margin + 162, label: "Total", width: 30 },
    ];

    columns.forEach(({ x, label, width }) => {
      if (label === "Product") {
        doc.text(label, x, tableTop + 5.5);
        return;
      }
      doc.text(label, x + width, tableTop + 5.5, { align: "right" });
    });
  };

  const drawTotals = (startY: number) => {
    const totalsX = pageWidth - margin;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(30, 30, 30);
    doc.text(`Subtotal: ${formatCurrency(data.subtotal)}`, totalsX, startY, { align: "right" });

    if (data.discountAmount > 0) {
      doc.text(`Invoice Discount: ${formatCurrency(data.discountAmount)}`, totalsX, startY + 6, {
        align: "right",
      });
    }

    if (data.gstEnabled) {
      doc.text(`GST: ${formatCurrency(data.gstAmount)}`, totalsX, startY + (data.discountAmount > 0 ? 12 : 6), {
        align: "right",
      });
    }

    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 61, 46);
    doc.text(
      `Grand Total: ${formatCurrency(data.totalAmount)}`,
      totalsX,
      startY + (data.discountAmount > 0 ? (data.gstEnabled ? 18 : 12) : data.gstEnabled ? 12 : 6),
      { align: "right" }
    );
  };

  drawHeader();

  let y = 52;
  doc.setTextColor(28, 28, 28);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(data.gstEnabled ? "TAX INVOICE" : "INVOICE", margin, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  y += 7;
  doc.text(`Invoice No: ${data.invoiceNumber}`, margin, y);
  doc.text(`Date: ${data.invoiceDate}`, pageWidth - margin, y, { align: "right" });
  y += 6;
  doc.text(`Payment: ${data.paymentType}`, margin, y);
  doc.text(`Type: ${data.invoiceType.replace("_", " ")}`, pageWidth - margin, y, { align: "right" });
  if (data.deliveryBy) {
    y += 6;
    doc.text(`Delivery By: ${data.deliveryBy}`, margin, y);
  }

  y += 12;
  doc.setFillColor(248, 244, 233);
  doc.roundedRect(margin, y - 5, contentWidth, 20, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Bill To:", margin + 2, y);
  doc.setFont("helvetica", "normal");
  y += 6;
  const customerNameLines = wrapText(data.customerName, contentWidth - 4, 2);
  doc.text(customerNameLines, margin + 2, y);
  y += customerNameLines.length * 4;

  const customerAddress = `${data.customerMobile} | ${data.customerAddress}`;
  const customerAddressLines = wrapText(customerAddress, contentWidth - 4, 2);
  doc.text(customerAddressLines, margin + 2, y);
  y += customerAddressLines.length * 4;

  if (data.customerGst) {
    doc.text(`GSTIN: ${data.customerGst}`, margin + 2, y);
    y += 5;
  }

  const tableTop = y + 8;
  drawProductHeader(tableTop);

  let rowY = tableTop + 9;
  const rowHeight = 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(26, 26, 26);

  data.items.forEach((item, index) => {
    const displayName = item.marathiName ? `${item.marathiName} (${item.name})` : item.name;
    const productLines = wrapText(displayName, 74, 2);
    const requiredRowHeight = Math.max(rowHeight, productLines.length * 4 + 3);

    if (rowY + requiredRowHeight > pageHeight - 38) {
      doc.addPage();
      drawHeader();
      rowY = 18;
      drawProductHeader(rowY);
      rowY += 9;
    }

    const bg = index % 2 === 0 ? 252 : 248;
    doc.setFillColor(bg, bg, bg);
    doc.rect(margin, rowY, contentWidth, requiredRowHeight, "F");

    doc.text(productLines, margin + 2, rowY + 4.5);
    doc.text(`${item.quantity} ${item.unit}`, margin + 80 + 18, rowY + 4.5, { align: "right" });
    doc.text(item.rate.toFixed(2), margin + 99 + 24, rowY + 4.5, { align: "right" });
    doc.text(item.discountAmount.toFixed(2), margin + 124 + 20, rowY + 4.5, { align: "right" });
    doc.text(data.gstEnabled ? `${item.gstPercent}%` : "-", margin + 145 + 16, rowY + 4.5, { align: "right" });
    doc.text(item.amount.toFixed(2), margin + 162 + 30, rowY + 4.5, { align: "right" });

    rowY += requiredRowHeight + 1;
  });

  const totalsY = rowY + 8;
  drawTotals(totalsY);

  if (data.notes) {
    const noteLines = wrapText(`Notes: ${data.notes}`, pageWidth - margin * 2, 2);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(88, 88, 88);
    doc.text(noteLines, margin, pageHeight - 18);
  }

  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 61, 46);
  doc.setFontSize(8.5);
  doc.text("Thank you for your business.", pageWidth / 2, pageHeight - 25, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  doc.text(businessInfo.footer, pageWidth / 2, pageHeight - 8, { align: "center" });

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
