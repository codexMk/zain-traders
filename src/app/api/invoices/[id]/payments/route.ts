import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { invoiceStatusFromPayments } from "@/lib/reconciliation";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  amount: z.number().positive().finite(),
  paymentDate: z.string().datetime({ offset: true }),
  paymentMethod: z.enum(["CASH", "UPI"]),
  reference: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(300).optional(),
  idempotencyKey: z.string().uuid(),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole(request, ["OWNER", "STAFF", "ACCOUNTANT"]);
  if (session instanceof NextResponse) return session;
  const { id } = await params;
  try {
    const data = schema.parse(await request.json());
    const existing = await prisma.customerPayment.findUnique({ where: { idempotencyKey: data.idempotencyKey } });
    if (existing) return NextResponse.json(existing, { status: 200 });

    const payment = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Invoice" WHERE "id" = ${id} FOR UPDATE`;
      const invoice = await tx.invoice.findUnique({ where: { id } });
      if (!invoice) throw new Error("NOT_FOUND: Invoice not found");
      if (invoice.status === "DRAFT" || invoice.status === "CANCELLED") throw new Error("INVALID: Payments can only be added to active finalized invoices");
      const duplicate = await tx.customerPayment.findUnique({ where: { idempotencyKey: data.idempotencyKey } });
      if (duplicate) return duplicate;

      const currentPayments = await tx.customerPayment.findMany({ where: { invoiceId: id, reversedAt: null }, select: { amount: true } });
      const recordedPaid = currentPayments.reduce((sum, row) => sum + row.amount, 0);
      const openingPaid = Math.max(0, invoice.paidAmount - recordedPaid);
      const paid = openingPaid + recordedPaid;
      const remaining = Math.max(0, invoice.totalAmount - paid);
      if (data.amount > remaining) throw new Error("INVALID: Payment exceeds the remaining invoice balance");

      const created = await tx.customerPayment.create({ data: {
        invoiceId: id,
        customerId: invoice.customerId,
        amount: data.amount,
        paymentDate: new Date(data.paymentDate),
        paymentMethod: data.paymentMethod,
        reference: data.reference || null,
        notes: data.notes || null,
        idempotencyKey: data.idempotencyKey,
      } });
      const nextPaid = Math.round((paid + data.amount + Number.EPSILON) * 100) / 100;
      await tx.invoice.update({ where: { id }, data: { paidAmount: nextPaid, status: invoiceStatusFromPayments(invoice.totalAmount, nextPaid) } });

      if (invoice.customerId) {
        const balances = await tx.invoice.findMany({ where: { customerId: invoice.customerId, status: { not: "CANCELLED" } }, select: { totalAmount: true, paidAmount: true } });
        const outstanding = balances.reduce((sum, row) => sum + Math.max(0, row.totalAmount - row.paidAmount), 0);
        await tx.customer.update({ where: { id: invoice.customerId }, data: { outstandingAmount: outstanding } });
        await tx.ledger.create({ data: {
          customerId: invoice.customerId,
          entryDate: created.paymentDate,
          description: `Payment received for invoice ${invoice.invoiceNumber}`,
          debit: 0,
          credit: created.amount,
          balance: outstanding,
          ledgerType: "RECEIPT",
        } });
      }
      return created;
    }, { isolationLevel: "Serializable" });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid payment" }, { status: 400 });
    if (error instanceof Error && error.message.startsWith("NOT_FOUND:")) return NextResponse.json({ error: error.message.split(":")[1].trim() }, { status: 404 });
    if (error instanceof Error && error.message.startsWith("INVALID:")) return NextResponse.json({ error: error.message.split(":")[1].trim() }, { status: 400 });
    if (error instanceof Error && error.message.includes("Unique constraint failed")) return NextResponse.json({ error: "Duplicate payment detected" }, { status: 409 });
    console.error("POST invoice payment failed", error);
    return NextResponse.json({ error: "Failed to record payment" }, { status: 500 });
  }
}
