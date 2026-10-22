const roundMoney = (amount: number) => Math.round((amount + Number.EPSILON) * 100) / 100;

export type InvoiceLineInput = {
  productId?: string | null;
  productName?: string;
  productSku?: string | null;
  hsnCode?: string | null;
  unit?: string;
  quantity: number;
  rate: number;
  discountPercent?: number;
  discountAmount?: number;
  gstPercent: number;
};

export type CalculatedLineItem = InvoiceLineInput & {
  lineSubtotal: number;
  lineDiscount: number;
  allocatedInvoiceDiscount: number;
  lineTaxable: number;
  lineGst: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  amount: number;
};

export function calculateInvoiceTotals(
  items: InvoiceLineInput[],
  invoiceDiscountAmount = 0,
  gstEnabled = true,
  taxTreatment: "INTRA_STATE" | "INTER_STATE" = "INTRA_STATE",
) {
  if (!items.length) throw new Error("Add at least one invoice item");
  if (!Number.isFinite(invoiceDiscountAmount) || invoiceDiscountAmount < 0) {
    throw new Error("Invoice discount must be a non-negative amount");
  }

  const normalized = items.map((item) => {
    const { quantity, rate, gstPercent } = item;
    if (!Number.isFinite(quantity) || quantity <= 0) throw new Error("Quantity must be greater than zero");
    if (!Number.isFinite(rate) || rate < 0) throw new Error("Rate must be a non-negative amount");
    if (!Number.isFinite(gstPercent) || gstPercent < 0 || gstPercent > 100) throw new Error("GST rate must be between 0 and 100");

    const lineSubtotal = roundMoney(quantity * rate);
    const discountPercent = item.discountPercent ?? 0;
    const lineDiscount = roundMoney(item.discountAmount ?? (lineSubtotal * discountPercent) / 100);
    if (!Number.isFinite(lineDiscount) || lineDiscount < 0 || lineDiscount > lineSubtotal) {
      throw new Error("Item discount cannot exceed its line amount");
    }
    return { ...item, lineSubtotal, lineDiscount, afterLineDiscount: roundMoney(lineSubtotal - lineDiscount) };
  });

  const availableForInvoiceDiscount = roundMoney(normalized.reduce((sum, item) => sum + item.afterLineDiscount, 0));
  if (invoiceDiscountAmount > availableForInvoiceDiscount) {
    throw new Error("Invoice discount cannot exceed the amount after item discounts");
  }
  const invoiceDiscount = roundMoney(invoiceDiscountAmount);
  const allocationBase = availableForInvoiceDiscount;
  let allocatedSoFar = 0;

  const calculatedItems: CalculatedLineItem[] = normalized.map((item, index) => {
    const allocatedInvoiceDiscount = index === normalized.length - 1
      ? roundMoney(invoiceDiscount - allocatedSoFar)
      : allocationBase > 0
        ? roundMoney(invoiceDiscount * item.afterLineDiscount / allocationBase)
        : 0;
    allocatedSoFar = roundMoney(allocatedSoFar + allocatedInvoiceDiscount);
    const lineTaxable = roundMoney(item.afterLineDiscount - allocatedInvoiceDiscount);
    const lineGst = gstEnabled ? roundMoney(lineTaxable * item.gstPercent / 100) : 0;
    const cgstAmount = gstEnabled && taxTreatment === "INTRA_STATE" ? roundMoney(lineGst / 2) : 0;
    const sgstAmount = gstEnabled && taxTreatment === "INTRA_STATE" ? roundMoney(lineGst - cgstAmount) : 0;
    const igstAmount = gstEnabled && taxTreatment === "INTER_STATE" ? lineGst : 0;

    return {
      ...item,
      discountPercent: item.discountPercent ?? 0,
      discountAmount: roundMoney(item.lineDiscount + allocatedInvoiceDiscount),
      allocatedInvoiceDiscount,
      lineTaxable,
      lineGst,
      cgstAmount,
      sgstAmount,
      igstAmount,
      amount: roundMoney(lineTaxable + lineGst),
    };
  });

  const subtotal = roundMoney(calculatedItems.reduce((sum, item) => sum + item.lineSubtotal, 0));
  const itemDiscounts = roundMoney(normalized.reduce((sum, item) => sum + item.lineDiscount, 0));
  const taxableAmount = roundMoney(calculatedItems.reduce((sum, item) => sum + item.lineTaxable, 0));
  const gstAmount = roundMoney(calculatedItems.reduce((sum, item) => sum + item.lineGst, 0));
  const cgstAmount = roundMoney(calculatedItems.reduce((sum, item) => sum + item.cgstAmount, 0));
  const sgstAmount = roundMoney(calculatedItems.reduce((sum, item) => sum + item.sgstAmount, 0));
  const igstAmount = roundMoney(calculatedItems.reduce((sum, item) => sum + item.igstAmount, 0));
  const totalAmount = roundMoney(calculatedItems.reduce((sum, item) => sum + item.amount, 0));

  return {
    calculatedItems,
    subtotal,
    itemDiscounts,
    discountAmount: roundMoney(itemDiscounts + invoiceDiscount),
    taxableAmount,
    gstAmount,
    cgstAmount,
    sgstAmount,
    igstAmount,
    totalAmount,
  };
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function amountInWords(amount: number) {
  const rupees = Math.floor(Math.max(0, amount));
  const paise = Math.round((amount - rupees) * 100);
  const words = (value: number): string => {
    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    if (value < 20) return ones[value];
    if (value < 100) return `${tens[Math.floor(value / 10)]} ${ones[value % 10]}`.trim();
    if (value < 1000) return `${ones[Math.floor(value / 100)]} Hundred ${words(value % 100)}`.trim();
    for (const [size, label] of [[10000000, "Crore"], [100000, "Lakh"], [1000, "Thousand"]] as const) {
      if (value >= size) return `${words(Math.floor(value / size))} ${label} ${words(value % size)}`.trim();
    }
    return `${words(Math.floor(value / 100))} Hundred ${words(value % 100)}`.trim();
  };
  return `${words(rupees) || "Zero"} Rupees${paise ? ` and ${words(paise)} Paise` : ""} Only`;
}
