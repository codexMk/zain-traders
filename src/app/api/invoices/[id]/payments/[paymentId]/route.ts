import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { invoiceStatusFromPayments } from "@/lib/reconciliation";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const reversalSchema = z.object({ reason: z.string().trim().min(1).max(500) });

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string; paymentId: string }> }) {
  const session = await requireRole(request, ["OWNER"]);
  if (session instanceof NextResponse) return session;
  const { id, paymentId } = await params;
  try {
    const { reason } = reversalSchema.parse(await request.json());
    const result = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Invoice" WHERE "id" = ${id} FOR UPDATE`;
      const payment = await tx.customerPayment.findFirst({ where: { id: paymentId, invoiceId: id } });
      if (!payment) throw new Error("NOT_FOUND: Payment not found");
      if (payment.reversedAt) return payment;
      const invoice = await tx.invoice.findUniqueOrThrow({ where: { id } });
      const activeBefore = await tx.customerPayment.findMany({ where: { invoiceId: id, reversedAt: null }, select: { amount: true } });
      const openingPaid = Math.max(0, invoice.paidAmount - activeBefore.reduce((sum, row) => sum + row.amount, 0));
      const reversed = await tx.customerPayment.update({ where: { id: paymentId }, data: {
        reversedAt: new Date(),
        reversedById: session.user.id,
        reversalReason: reason,
      } });
      const active = await tx.customerPayment.findMany({ where: { invoiceId: id, reversedAt: null }, select: { amount: true } });
      const paid = Math.round((openingPaid + active.reduce((sum, row) => sum + row.amount, 0) + Number.EPSILON) * 100) / 100;
      await tx.invoice.update({ where: { id }, data: {
        paidAmount: paid,
        status: invoiceStatusFromPayments(invoice.totalAmount, paid),
      } });
      if (payment.customerId) {
        const receivables = await tx.invoice.findMany({ where: { customerId: payment.customerId, status: { not: "CANCELLED" } }, select: { totalAmount: true, paidAmount: true } });
        const outstanding = receivables.reduce((sum, row) => sum + Math.max(0, row.totalAmount - row.paidAmount), 0);
        await tx.customer.update({ where: { id: payment.customerId }, data: { outstandingAmount: outstanding } });
        await tx.ledger.create({ data: {
          customerId: payment.customerId,
          entryDate: new Date(),
          description: `Payment reversal for invoice ${invoice.invoiceNumber}: ${reason}`,
          debit: payment.amount,
          credit: 0,
          balance: outstanding,
          ledgerType: "RECEIPT_REVERSAL",
        } });
      }
      return reversed;
    }, { isolationLevel: "Serializable" });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0]?.message ?? "A reversal reason is required" }, { status: 400 });
    if (error instanceof Error && error.message.startsWith("NOT_FOUND:")) return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    console.error("POST payment reversal failed", error);
    return NextResponse.json({ error: "Could not reverse payment" }, { status: 500 });
  }
}
