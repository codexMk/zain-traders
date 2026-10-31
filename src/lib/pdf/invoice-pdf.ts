import { jsPDF } from "jspdf";
import { businessInfo } from "@/lib/business-info";
import { amountInWords, formatCurrency } from "@/lib/invoice-utils";

export interface InvoicePdfData {
  authorizedSignatureDataUrl?: string;
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
    const gstin = data.gstEnabled ? data.supplierGstin || businessInfo.gstin : null;
    if (gstin) {
      doc.setTextColor(212, 175, 55);
      doc.text(`GSTIN: ${gstin}`, pageWidth - margin, 8, { align: "right" });
    }
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(6.5);
    if (data.gstEnabled) doc.text("ORIGINAL FOR RECIPIENT", pageWidth - margin, 13, { align: "right" });
  };

  const drawTableHeader = (y: number) => {
    doc.setFillColor(15, 61, 46);
    doc.rect(margin, y, contentWidth, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.4);
    doc.setTextColor(255, 255, 255);
    const cols = data.gstEnabled ? [
      { label: "Description", start: 2, width: 44, align: "left" as const },
      { label: "HSN/SAC", start: 46, width: 14, align: "left" as const },
      { label: "Qty", start: 60, width: 18, align: "right" as const },
      { label: "Rate", start: 78, width: 18, align: "right" as const },
      { label: "Disc.", start: 96, width: 14, align: "right" as const },
      { label: "Taxable", start: 110, width: 22, align: "right" as const },
      { label: "GST %", start: 132, width: 12, align: "right" as const },
      { label: "GST Amt.", start: 144, width: 18, align: "right" as const },
      { label: "Total", start: 162, width: 22, align: "right" as const },
    ] : [
      { label: "Description", start: 2, width: 52, align: "left" as const },
      { label: "HSN/SAC", start: 54, width: 18, align: "left" as const },
      { label: "Qty", start: 72, width: 20, align: "right" as const },
      { label: "Rate", start: 92, width: 23, align: "right" as const },
      { label: "Disc.", start: 115, width: 18, align: "right" as const },
      { label: "Taxable", start: 133, width: 25, align: "right" as const },
      { label: "Total", start: 158, width: 26, align: "right" as const },
    ];
    for (const col of cols) {
      const x = margin + col.start + (col.align === "right" ? col.width : 0);
      doc.text(col.label, x, y + 5.4, { align: col.align });
    }
  };

  drawHeader();
  doc.setTextColor(26, 26, 26);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14.5);
  doc.text(data.gstEnabled ? "TAX INVOICE" : "NON-GST INVOICE", margin, 43);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(`Invoice: ${data.invoiceNumber}`, margin, 49);
  doc.text(`Date: ${data.invoiceDate}`, pageWidth - margin, 49, { align: "right" });
  doc.text(`Payment status: ${data.paymentStatus}`, margin, 54);
  doc.text(`Mode: ${data.paymentType}`, pageWidth - margin, 54, { align: "right" });
  if (data.placeOfSupplyStateCode) doc.text(`Place of supply state code: ${data.placeOfSupplyStateCode}`, margin, 59);

  const customerY = data.placeOfSupplyStateCode ? 67 : 64;
  doc.setFillColor(248, 246, 239);
  doc.roundedRect(margin, customerY, contentWidth, 22, 1.5, 1.5, "F");
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

  let rowY = customerY + 25;
  drawTableHeader(rowY);
  rowY += 9;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  for (const [index, item] of data.items.entries()) {
    const nameColumn = data.gstEnabled ? 44 : 52;
    const nameLines = wrap(item.name, nameColumn - 3);
    const rowHeight = Math.max(9, nameLines.length * 4 + 4);
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
    const gstAmount = item.cgstAmount + item.sgstAmount + item.igstAmount;
    doc.setDrawColor(180, 180, 180);
    doc.rect(margin, rowY - 2, contentWidth, rowHeight);
    doc.setTextColor(28, 28, 28);
    const cells = data.gstEnabled
      ? [
          { value: nameLines, start: 2, width: 44, align: "left" as const },
          { value: item.hsnCode || "-", start: 46, width: 14, align: "left" as const },
          { value: `${item.quantity} ${item.unit}`, start: 60, width: 18, align: "right" as const },
          { value: item.rate.toFixed(2), start: 78, width: 18, align: "right" as const },
          { value: item.discountAmount.toFixed(2), start: 96, width: 14, align: "right" as const },
          { value: item.taxableAmount.toFixed(2), start: 110, width: 22, align: "right" as const },
          { value: `${item.gstPercent}%`, start: 132, width: 12, align: "right" as const },
          { value: (gstAmount || item.amount - item.taxableAmount).toFixed(2), start: 144, width: 18, align: "right" as const },
          { value: item.amount.toFixed(2), start: 162, width: 22, align: "right" as const },
        ]
      : [
          { value: nameLines, start: 2, width: 52, align: "left" as const },
          { value: item.hsnCode || "-", start: 54, width: 18, align: "left" as const },
          { value: `${item.quantity} ${item.unit}`, start: 72, width: 20, align: "right" as const },
          { value: item.rate.toFixed(2), start: 92, width: 23, align: "right" as const },
          { value: item.discountAmount.toFixed(2), start: 115, width: 18, align: "right" as const },
          { value: item.taxableAmount.toFixed(2), start: 133, width: 25, align: "right" as const },
          { value: item.amount.toFixed(2), start: 158, width: 26, align: "right" as const },
        ];
    for (const cell of cells) {
      const x = margin + cell.start + (cell.align === "right" ? cell.width : 0);
      doc.text(cell.value, x, rowY + 3, { align: cell.align });
    }
    rowY += rowHeight;
  }

  const totalsHeight = 100 + (data.gstEnabled ? 12 : 0) + (data.notes ? 8 : 0);
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
    doc.setFontSize(bold ? 10.5 : 9);
    doc.setTextColor(bold ? 15 : 45, bold ? 61 : 45, bold ? 46 : 45);
    doc.text(label, labelX, rowY);
    doc.text(value, valueX, rowY, { align: "right" });
    rowY += bold ? 6.5 : 5;
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
  const footerStart = rowY + 2;
  doc.setDrawColor(170, 170, 170);
  doc.rect(margin, footerStart - 4, contentWidth, 84);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(35, 35, 35);
  doc.text("Total in words", margin + 3, footerStart + 2);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(wrap(amountInWords(data.totalAmount).toUpperCase(), 90).slice(0, 3), margin + 3, footerStart + 8);
  doc.setDrawColor(180, 180, 180);
  doc.line(margin + 98, footerStart - 4, margin + 98, footerStart + 80);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("Bank Details", margin + 3, footerStart + 21);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Account holder: ${businessInfo.bank.accountHolder}`, margin + 3, footerStart + 27);
  doc.text(`Bank: ${businessInfo.bank.name}`, margin + 3, footerStart + 32);
  doc.text(`Account number: ${businessInfo.bank.accountNumber}`, margin + 3, footerStart + 37);
  doc.setFont("helvetica", "bold");
  doc.text("Terms and Conditions", margin + 3, footerStart + 48);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  const termsText = businessInfo.invoiceTerms.map((term, index) => `${index + 1}. ${term}`).join("  ");
  doc.text(wrap(termsText, 90).slice(0, 4), margin + 3, footerStart + 53);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(`For ${data.supplierName || businessInfo.nameEnglish}`, pageWidth - margin - 3, footerStart + 40, { align: "right" });
  if (data.authorizedSignatureDataUrl) {
    doc.addImage(data.authorizedSignatureDataUrl, "PNG", pageWidth - margin - 45, footerStart + 43, 42, 14);
  }
  doc.setDrawColor(120, 120, 120);
  doc.line(pageWidth - margin - 45, footerStart + 64, pageWidth - margin - 3, footerStart + 64);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.text("Authorized Signatory", pageWidth - margin - 3, footerStart + 69, { align: "right" });
  if (data.notes) {
    doc.setFont("helvetica", "normal");
    doc.text(wrap(`Notes: ${data.notes}`, 90).slice(0, 2), margin + 3, footerStart + 16);
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(businessInfo.invoiceThankYou, margin, Math.min(footerStart + 77, bottom - 2));
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
