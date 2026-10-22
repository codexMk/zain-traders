import { jsPDF } from "jspdf";
import { amountInWords, formatCurrency } from "@/lib/invoice-utils";

export interface InvoicePdfData {
  invoiceNumber: string;
  invoiceDate: string;
  customerName: string;
  customerMobile: string;
  customerAddress: string;
  customerGst?: string | null;
  supplierName: string;
  supplierAddress: string;
  supplierGstin?: string | null;
  supplierPhones: string[];
  paymentType: string;
  paymentStatus: string;
  gstEnabled: boolean;
  invoiceType: string;
  placeOfSupplyStateCode?: string | null;
  deliveryBy?: string | null;
  items: {
    name: string;
    hsnCode?: string | null;
    quantity: number;
    rate: number;
    discountAmount: number;
    gstPercent: number;
    amount: number;
    unit: string;
    taxableAmount: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
  }[];
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  gstAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  notes?: string | null;
}

const money = (value: number) => formatCurrency(value).replace("₹", "Rs. ");

export function generateInvoicePdf(data: InvoicePdfData): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;
  const bottom = pageHeight - 14;
  const wrap = (value: string, width: number) => doc.splitTextToSize(value || "", width) as string[];

  const drawHeader = () => {
    doc.setFillColor(15, 61, 46);
    doc.rect(0, 0, pageWidth, 34, "F");
    doc.setFillColor(212, 175, 55);
    doc.circle(margin + 8, 12, 7, "F");
    doc.setTextColor(15, 61, 46);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("ZT", margin + 8, 15, { align: "center" });
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(17);
    doc.text(data.supplierName || "Zain Traders", pageWidth / 2, 12, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Wholesale Spices and Dry Fruits", pageWidth / 2, 18, { align: "center" });
    const addressLines = wrap(data.supplierAddress, contentWidth - 4).slice(0, 2);
    doc.text(addressLines, pageWidth / 2, 23, { align: "center" });
    doc.text(data.supplierPhones.join(" | "), pageWidth / 2, 31, { align: "center" });
    if (data.supplierGstin) {
      doc.setTextColor(212, 175, 55);
      doc.text(`GSTIN: ${data.supplierGstin}`, pageWidth - margin, 8, { align: "right" });
    }
  };

  const drawTableHeader = (y: number) => {
    doc.setFillColor(15, 61, 46);
    doc.rect(margin, y, contentWidth, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.8);
    doc.setTextColor(255, 255, 255);
    const cols = [
      { label: "Description", start: 2, width: 50, align: "left" as const },
      { label: "HSN", start: 52, width: 16, align: "left" as const },
      { label: "Qty", start: 68, width: 20, align: "right" as const },
      { label: "Rate", start: 88, width: 20, align: "right" as const },
      { label: "Disc", start: 108, width: 16, align: "right" as const },
      { label: "Taxable", start: 124, width: 22, align: "right" as const },
      { label: "GST", start: 146, width: 14, align: "right" as const },
      { label: "Amount", start: 160, width: 20, align: "right" as const },
    ];
    for (const col of cols) {
      const x = margin + col.start + (col.align === "right" ? col.width : 0);
      doc.text(col.label, x, y + 5.4, { align: col.align });
    }
  };

  drawHeader();
  doc.setTextColor(26, 26, 26);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(data.gstEnabled ? "TAX INVOICE" : "INVOICE", margin, 43);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(`Invoice: ${data.invoiceNumber}`, margin, 49);
  doc.text(`Date: ${data.invoiceDate}`, pageWidth - margin, 49, { align: "right" });
  doc.text(`Payment status: ${data.paymentStatus}`, margin, 54);
  doc.text(`Mode: ${data.paymentType}`, pageWidth - margin, 54, { align: "right" });
  if (data.placeOfSupplyStateCode) doc.text(`Place of supply state code: ${data.placeOfSupplyStateCode}`, margin, 59);

  const customerY = 64;
  doc.setFillColor(248, 246, 239);
  doc.roundedRect(margin, customerY, contentWidth, 20, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("BILL TO", margin + 3, customerY + 5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(wrap(data.customerName || "Walk-in Customer", contentWidth - 6).slice(0, 1), margin + 3, customerY + 10);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  const address = [data.customerMobile, data.customerAddress].filter(Boolean).join(" | ");
  doc.text(wrap(address, contentWidth - 6).slice(0, 1), margin + 3, customerY + 15);
  if (data.customerGst) doc.text(`GSTIN: ${data.customerGst}`, pageWidth - margin - 3, customerY + 5, { align: "right" });
  if (data.deliveryBy) doc.text(`Delivery: ${data.deliveryBy}`, pageWidth - margin - 3, customerY + 10, { align: "right" });

  let rowY = 91;
  drawTableHeader(rowY);
  rowY += 9;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  for (const [index, item] of data.items.entries()) {
    const nameLines = wrap(item.name, 48);
    const rowHeight = Math.max(8, nameLines.length * 3.6 + 3);
    if (rowY + rowHeight > bottom - 40) {
      doc.addPage();
      drawHeader();
      rowY = 42;
      drawTableHeader(rowY);
      rowY += 9;
    }
    if (index % 2 === 0) {
      doc.setFillColor(248, 248, 248);
      doc.rect(margin, rowY - 2, contentWidth, rowHeight, "F");
    }
    doc.setTextColor(28, 28, 28);
    doc.text(nameLines, margin + 2, rowY + 2.4);
    doc.text(item.hsnCode || "-", margin + 54, rowY + 2.4);
    doc.text(`${item.quantity} ${item.unit}`, margin + 88, rowY + 2.4, { align: "right" });
    doc.text(item.rate.toFixed(2), margin + 108, rowY + 2.4, { align: "right" });
    doc.text(item.discountAmount.toFixed(2), margin + 124, rowY + 2.4, { align: "right" });
    doc.text(item.taxableAmount.toFixed(2), margin + 146, rowY + 2.4, { align: "right" });
    doc.text(data.gstEnabled ? `${item.gstPercent}%` : "-", margin + 160, rowY + 2.4, { align: "right" });
    doc.text(item.amount.toFixed(2), margin + 180, rowY + 2.4, { align: "right" });
    rowY += rowHeight;
  }

  const totalsHeight = 48 + (data.gstEnabled ? 12 : 0) + (data.notes ? 8 : 0);
  if (rowY + totalsHeight > bottom) {
    doc.addPage();
    drawHeader();
    rowY = 43;
  }
  rowY += 4;
  const labelX = pageWidth - margin - 58;
  const valueX = pageWidth - margin;
  const totalRow = (label: string, value: string, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(bold ? 9.5 : 8);
    doc.setTextColor(bold ? 15 : 45, bold ? 61 : 45, bold ? 46 : 45);
    doc.text(label, labelX, rowY);
    doc.text(value, valueX, rowY, { align: "right" });
    rowY += bold ? 6 : 4.5;
  };
  totalRow("Subtotal", money(data.subtotal));
  totalRow("Discount", `-${money(data.discountAmount)}`);
  totalRow("Taxable amount", money(data.taxableAmount));
  if (data.gstEnabled) {
    if (data.igstAmount > 0) totalRow("IGST", money(data.igstAmount));
    else if (data.cgstAmount > 0 || data.sgstAmount > 0) {
      totalRow("CGST", money(data.cgstAmount));
      totalRow("SGST", money(data.sgstAmount));
    } else totalRow("GST", money(data.gstAmount));
  }
  doc.setDrawColor(15, 61, 46);
  doc.line(labelX, rowY - 2, valueX, rowY - 2);
  totalRow("Grand total", money(data.totalAmount), true);
  totalRow("Amount received", money(data.paidAmount));
  totalRow("Amount due", money(data.balanceDue), true);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.text(`Amount in words: ${amountInWords(data.totalAmount)}`, margin, Math.min(rowY + 2, bottom - 7));
  if (data.notes) {
    doc.setFont("helvetica", "normal");
    doc.text(wrap(`Notes: ${data.notes}`, contentWidth).slice(0, 2), margin, Math.min(rowY + 8, bottom - 2));
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page);
    doc.text(`${data.invoiceNumber} · ${page}/${pages}`, pageWidth - margin, pageHeight - 5, { align: "right" });
  }
  return doc;
}

export function downloadInvoicePdf(data: InvoicePdfData, filename?: string) {
  generateInvoicePdf(data).save(filename ?? `${data.invoiceNumber}.pdf`);
}

export function getInvoicePdfBlob(data: InvoicePdfData): Blob {
  return generateInvoicePdf(data).output("blob");
}
