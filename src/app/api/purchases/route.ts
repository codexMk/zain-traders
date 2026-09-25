import { requireAuth, requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { generatePurchaseNumber } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const purchaseItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().positive(),
  rate: z.number().min(0),
  gstPercentage: z.number().min(0).default(5),
});

const createPurchaseSchema = z.object({
  supplierId: z.string().min(1),
  purchaseDate: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(purchaseItemSchema).min(1),
});

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    const purchases = await prisma.purchase.findMany({
      include: {
        supplier: true,
        items: { include: { product: true } },
        payments: true,
      },
      orderBy: { purchaseDate: "desc" },
    });

    const formatted = purchases.map((purchase) => ({
      id: purchase.id,
      purchaseNumber: purchase.invoiceNumber,
      supplierId: purchase.supplierId,
      supplierName: purchase.supplier.name,
      total: purchase.totalAmount,
      status: purchase.isCompleted ? "APPROVED" : "PENDING",
      approvalStatus: purchase.isCompleted ? "APPROVED" : "PENDING",
      createdAt: purchase.purchaseDate,
      notes: purchase.notes,
      paidAmount: purchase.payments.reduce((sum, payment) => sum + payment.amount, 0),
      paymentStatus:
        purchase.payments.reduce((sum, payment) => sum + payment.amount, 0) >= purchase.totalAmount
          ? "PAID"
          : purchase.payments.length > 0
            ? "PARTIALLY_PAID"
            : "UNPAID",
    }));

    return NextResponse.json(formatted);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(request, ["OWNER", "STAFF"]);
    if (session instanceof NextResponse) return session;

    const body = await request.json();
    const data = createPurchaseSchema.parse(body);

    const supplier = await prisma.supplier.findUnique({ where: { id: data.supplierId } });
    if (!supplier) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    }

    const purchaseDate = data.purchaseDate ? new Date(data.purchaseDate) : new Date();
    const invoiceNumber = generatePurchaseNumber();

    const lineItems = data.items.map((item) => {
      const amount = Number((item.quantity * item.rate).toFixed(2));
      return {
        productId: item.productId,
        quantity: item.quantity,
        rate: item.rate,
        gstPercentage: item.gstPercentage,
        amount,
      };
    });

    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const gstAmount = lineItems.reduce(
      (sum, item) => sum + item.amount * (item.gstPercentage / 100),
      0,
    );
    const totalAmount = Number((subtotal + gstAmount).toFixed(2));

    const purchase = await prisma.$transaction(async (tx) => {
      const created = await tx.purchase.create({
        data: {
          supplierId: data.supplierId,
          invoiceNumber,
          purchaseDate,
          taxableAmount: subtotal,
          totalAmount,
          gstAmount,
          notes: data.notes,
          isCompleted: false,
          items: {
            create: lineItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              rate: item.rate,
              gstPercentage: item.gstPercentage,
              amount: item.amount,
            })),
          },
        },
      });

      await tx.ledger.create({
        data: {
          supplierId: data.supplierId,
          entryDate: purchaseDate,
          description: `Purchase recorded for ${invoiceNumber}`,
          debit: totalAmount,
          credit: 0,
          balance: totalAmount,
          ledgerType: "PURCHASE",
        },
      });

      return created;
    });

    return NextResponse.json(purchase, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
