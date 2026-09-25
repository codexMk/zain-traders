import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const supplierPaymentSchema = z.object({
  purchaseId: z.string().min(1),
  amount: z.number().positive(),
  paymentDate: z.string().transform((value) => new Date(value)),
  paymentMethod: z.string().min(1).default("CASH"),
  idempotencyKey: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireRole(request, ["OWNER", "STAFF", "ACCOUNTANT"]);
    if (session instanceof NextResponse) return session;

    const body = await request.json();
    const data = supplierPaymentSchema.parse(body);
    const idempotencyKey = data.idempotencyKey ?? `${data.purchaseId}:${data.paymentDate.toISOString()}:${data.amount}`;

    const supplier = await prisma.supplier.findUnique({ where: { id } });
    if (!supplier) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    }

    const purchase = await prisma.purchase.findUnique({
      where: { id: data.purchaseId },
      include: { payments: true },
    });

    if (!purchase) {
      return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
    }

    if (purchase.supplierId !== id) {
      return NextResponse.json({ error: "Purchase does not belong to this supplier" }, { status: 400 });
    }

    const existingByKey = await prisma.supplierPayment.findUnique({
      where: { idempotencyKey },
    });

    if (existingByKey) {
      return NextResponse.json(existingByKey, { status: 200 });
    }

    const paidTotal = purchase.payments.reduce((sum, payment) => sum + payment.amount, 0);
    const remainingBalance = Math.max(0, purchase.totalAmount - paidTotal);

    if (data.amount > remainingBalance) {
      return NextResponse.json(
        { error: "Payment exceeds the remaining supplier balance" },
        { status: 400 }
      );
    }

    const payment = await prisma.$transaction(async (tx) => {
      const existing = await tx.supplierPayment.findUnique({
        where: { idempotencyKey },
      });

      if (existing) {
        return existing;
      }

      const created = await tx.supplierPayment.create({
        data: {
          purchaseId: purchase.id,
          supplierId: id,
          amount: data.amount,
          paymentDate: data.paymentDate,
          paymentMethod: data.paymentMethod,
          reference: data.reference,
          idempotencyKey,
          notes: data.notes,
        },
      });

      const nextPaid = paidTotal + data.amount;
      const nextBalance = Math.max(0, purchase.totalAmount - nextPaid);

      await tx.ledger.create({
        data: {
          supplierId: id,
          entryDate: data.paymentDate,
          description: `Supplier payment for purchase ${purchase.invoiceNumber}`,
          debit: 0,
          credit: data.amount,
          balance: nextBalance,
          ledgerType: "SUPPLIER_PAYMENT",
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
