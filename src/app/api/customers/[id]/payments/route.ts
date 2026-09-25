import { Prisma } from "@prisma/client";
import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const customerPaymentSchema = z.object({
  invoiceId: z.string().min(1),
  amount: z.number().positive(),
  paymentDate: z.string().transform((value) => new Date(value)),
  paymentMethod: z.string().min(1).default("CASH"),
  idempotencyKey: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

async function recalculateCustomerOutstanding(
  tx: Prisma.TransactionClient,
  customerId: string,
) {
  const invoiceTotals = await tx.invoice.findMany({
    where: { customerId },
    select: { totalAmount: true, paidAmount: true },
  });

  const outstanding = invoiceTotals.reduce(
    (sum, invoice) => sum + Math.max(0, invoice.totalAmount - invoice.paidAmount),
    0,
  );

  await tx.customer.update({
    where: { id: customerId },
    data: { outstandingAmount: outstanding },
  });

  return outstanding;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireRole(request, ["OWNER", "STAFF", "ACCOUNTANT"]);
    if (session instanceof NextResponse) return session;

    const body = await request.json();
    const data = customerPaymentSchema.parse(body);
    const idempotencyKey = data.idempotencyKey ?? `${data.invoiceId}:${data.paymentDate.toISOString()}:${data.amount}`;

    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: data.invoiceId },
      include: { payments: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (invoice.customerId !== id) {
      return NextResponse.json({ error: "Invoice does not belong to this customer" }, { status: 400 });
    }

    const existingByKey = await prisma.customerPayment.findUnique({
      where: { idempotencyKey },
    });

    if (existingByKey) {
      return NextResponse.json(existingByKey, { status: 200 });
    }

    const currentPaid = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
    const outstandingAfterPayment = Math.max(0, invoice.totalAmount - currentPaid);

    if (data.amount > outstandingAfterPayment) {
      return NextResponse.json(
        { error: "Payment exceeds the remaining invoice balance" },
        { status: 400 }
      );
    }

    const payment = await prisma.$transaction(async (tx) => {
      const existing = await tx.customerPayment.findUnique({
        where: { idempotencyKey },
      });

      if (existing) {
        return existing;
      }

      const created = await tx.customerPayment.create({
        data: {
          invoiceId: invoice.id,
          customerId: id,
          amount: data.amount,
          paymentDate: data.paymentDate,
          paymentMethod: data.paymentMethod,
          reference: data.reference,
          idempotencyKey,
          notes: data.notes,
        },
      });

      const nextPaidAmount = currentPaid + data.amount;
      const nextStatus = nextPaidAmount >= invoice.totalAmount ? "PAID" : "PARTIALLY_PAID";

      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          paidAmount: nextPaidAmount,
          status: nextStatus,
        },
      });

      const nextOutstanding = await recalculateCustomerOutstanding(tx, id);

      await tx.ledger.create({
        data: {
          customerId: id,
          entryDate: data.paymentDate,
          description: `Customer payment received for invoice ${invoice.invoiceNumber}`,
          debit: 0,
          credit: data.amount,
          balance: nextOutstanding,
          ledgerType: "RECEIPT",
        },
      });

      return created;
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }

    if (error instanceof Error && error.message.includes("Unique constraint failed")) {
      return NextResponse.json({ error: "Duplicate payment detected for this reference" }, { status: 409 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
