import type { InvoiceStatus } from "@prisma/client";

export type PaymentBucket = "paid" | "due" | "overdue";

export function invoiceRemaining(totalAmount: number, paidAmount: number) {
  return Math.max(0, totalAmount - paidAmount);
}

export function classifyInvoiceBucket(
  totalAmount: number,
  paidAmount: number,
  status: InvoiceStatus,
  dueDate: Date | null | undefined,
  now = new Date(),
): PaymentBucket {
  const remaining = invoiceRemaining(totalAmount, paidAmount);
  if (remaining <= 0 || status === "PAID") {
    return "paid";
  }

  if (dueDate) {
    const due = new Date(dueDate);
    due.setHours(23, 59, 59, 999);
    if (due < now) {
      return "overdue";
    }
  } else if (status === "OVERDUE") {
    return "overdue";
  }

  return "due";
}

export function allocationStatus(totalAmount: number, paidAmount: number) {
  const remaining = invoiceRemaining(totalAmount, paidAmount);
  if (remaining <= 0) {
    return { label: "Fully allocated", tone: "paid" as const, remaining: 0, percent: 100 };
  }
  if (paidAmount > 0) {
    const percent = Math.min(100, Math.round((paidAmount / totalAmount) * 100));
    return { label: "Partially allocated", tone: "partial" as const, remaining, percent };
  }
  return { label: "Unallocated", tone: "open" as const, remaining, percent: 0 };
}

export function purchasePaymentStatus(totalAmount: number, paidAmount: number) {
  const remaining = invoiceRemaining(totalAmount, paidAmount);
  if (remaining <= 0) return "PAID" as const;
  if (paidAmount > 0) return "PARTIALLY_PAID" as const;
  return "UNPAID" as const;
}
