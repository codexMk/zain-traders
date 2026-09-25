/**
 * Lightweight operational smoke checks (no database required).
 * Run: node scripts/qa-smoke.mjs
 */

import assert from "node:assert/strict";

const { classifyInvoiceBucket, invoiceRemaining, allocationStatus, purchasePaymentStatus } =
  await import("../src/lib/reconciliation.ts");

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

console.log("QA smoke checks passed: reconciliation helpers, payment buckets, allocation status.");
