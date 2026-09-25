import { prisma } from "@/lib/prisma";

export async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `ZT-${year}-`;

  const lastInvoice = await prisma.invoice.findFirst({
    where: { invoiceNumber: { startsWith: prefix } },
    orderBy: { invoiceNumber: "desc" },
    select: { invoiceNumber: true },
  });

  let nextNum = 1;
  if (lastInvoice) {
    const parts = lastInvoice.invoiceNumber.split("-");
    const lastNum = parseInt(parts[parts.length - 1], 10);
    if (!Number.isNaN(lastNum)) nextNum = lastNum + 1;
  }

  return `${prefix}${String(nextNum).padStart(4, "0")}`;
}

export interface InvoiceLineInput {
  productId: string;
  quantity: number;
  rate: number;
  discountPercent?: number;
  discountAmount?: number;
  gstPercent: number;
}

export interface CalculatedLineItem extends InvoiceLineInput {
  lineSubtotal: number;
  lineDiscount: number;
  lineTaxable: number;
  lineGst: number;
  amount: number;
}

export function calculateInvoiceTotals(
  items: InvoiceLineInput[],
  invoiceDiscountAmount = 0,
  gstEnabled = true
) {
  const calculatedItems: CalculatedLineItem[] = items.map((item) => {
    const lineSubtotal = item.quantity * item.rate;
    const lineDiscount =
      item.discountAmount ??
      (lineSubtotal * (item.discountPercent ?? 0)) / 100;
    const lineTaxable = lineSubtotal - lineDiscount;
    const lineGst = gstEnabled ? (lineTaxable * item.gstPercent) / 100 : 0;
    const amount = lineTaxable + lineGst;

    return {
      ...item,
      lineSubtotal,
      lineDiscount,
      lineTaxable,
      lineGst,
      amount,
    };
  });

  const subtotal = calculatedItems.reduce((sum, i) => sum + i.lineSubtotal, 0);
  const itemDiscounts = calculatedItems.reduce((sum, i) => sum + i.lineDiscount, 0);
  const taxableAmount = subtotal - itemDiscounts - invoiceDiscountAmount;
  const gstAmount = calculatedItems.reduce((sum, i) => sum + i.lineGst, 0);
  const totalAmount = taxableAmount + gstAmount;

  return {
    calculatedItems,
    subtotal,
    taxableAmount: Math.max(0, taxableAmount),
    gstAmount,
    totalAmount,
  };
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}
