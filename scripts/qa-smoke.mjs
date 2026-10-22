/**
 * Lightweight operational smoke checks (no database required).
 * Run: node scripts/qa-smoke.mjs
 */

import assert from "node:assert/strict";

const { classifyInvoiceBucket, invoiceRemaining, allocationStatus, purchasePaymentStatus, invoiceStatusFromPayments } =
  await import("../src/lib/reconciliation.ts");
const { calculateInvoiceTotals } = await import("../src/lib/invoice-utils.ts");
const { isValidDateOnly } = await import("../src/lib/date-utils.ts");

assert.equal(invoiceRemaining(1000, 400), 600);

const dueBucket = classifyInvoiceBucket(1000, 200, "PARTIALLY_PAID", new Date(Date.now() + 86400000));
assert.equal(dueBucket, "due");

const overdueBucket = classifyInvoiceBucket(1000, 200, "PARTIALLY_PAID", new Date(Date.now() - 86400000));
assert.equal(overdueBucket, "overdue");

const paidBucket = classifyInvoiceBucket(1000, 1000, "PAID", null);
assert.equal(paidBucket, "paid");

assert.equal(allocationStatus(1000, 1000).tone, "paid");
assert.equal(allocationStatus(1000, 250).tone, "partial");
assert.equal(purchasePaymentStatus(500, 500), "PAID");
assert.equal(isValidDateOnly("2026-10-22"), true);
assert.equal(isValidDateOnly("2026-02-30"), false);

const localTax = calculateInvoiceTotals(
  [{ productId: "spice-1", quantity: 1, rate: 100, discountAmount: 0, gstPercent: 5 }],
  10,
  true,
  "INTRA_STATE",
);
assert.equal(localTax.subtotal, 100);
assert.equal(localTax.discountAmount, 10);
assert.equal(localTax.taxableAmount, 90);
assert.equal(localTax.cgstAmount, 2.25);
assert.equal(localTax.sgstAmount, 2.25);
assert.equal(localTax.igstAmount, 0);
assert.equal(localTax.totalAmount, 94.5);

const interstateTax = calculateInvoiceTotals(
  [{ productId: "spice-2", quantity: 2, rate: 50, gstPercent: 18 }],
  0,
  true,
  "INTER_STATE",
);
assert.equal(interstateTax.igstAmount, 18);
assert.equal(interstateTax.cgstAmount, 0);
assert.equal(interstateTax.sgstAmount, 0);
assert.equal(interstateTax.totalAmount, 118);

const nonGst = calculateInvoiceTotals(
  [{ productId: null, productName: "One-time item", quantity: 3, rate: 10, gstPercent: 18 }],
  0,
  false,
);
assert.equal(nonGst.gstAmount, 0);
assert.equal(nonGst.totalAmount, 30);

const discounted = calculateInvoiceTotals(
  [{ productId: "spice-3", quantity: 1, rate: 100, discountPercent: 10, gstPercent: 5 }],
  5,
  true,
);
assert.equal(discounted.discountAmount, 15);
assert.equal(discounted.taxableAmount, 85);
assert.equal(discounted.totalAmount, 89.25);

assert.equal(invoiceStatusFromPayments(100, 0), "SENT");
assert.equal(invoiceStatusFromPayments(100, 40), "PARTIALLY_PAID");
assert.equal(invoiceStatusFromPayments(100, 100), "PAID");
assert.throws(() => calculateInvoiceTotals([{ quantity: 1, rate: 10, gstPercent: 5 }], 11, true), /Invoice discount/);
assert.throws(() => calculateInvoiceTotals([{ quantity: 0, rate: 10, gstPercent: 5 }]), /Quantity/);

console.log("QA smoke checks passed: billing totals, tax split, discount allocation, payment states, and reconciliation helpers.");
