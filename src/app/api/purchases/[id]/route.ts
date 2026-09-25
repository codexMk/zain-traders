import { requireAuth, requireRole } from "@/lib/auth-helpers";
import { postPurchaseStockReceipt, reversePurchaseStockReceipt } from "@/lib/purchase-inventory";
import { purchasePaymentStatus } from "@/lib/reconciliation";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const purchaseItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().positive(),
  rate: z.number().min(0),
  gstPercentage: z.number().min(0).default(5),
});

const updatePurchaseSchema = z.object({
  supplierId: z.string().min(1).optional(),
  purchaseDate: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(purchaseItemSchema).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    const purchase = await prisma.purchase.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: { include: { product: true } },
        payments: true,
      },
    });

    if (!purchase) {
      return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
    }

    const paidAmount = purchase.payments.reduce((sum, payment) => sum + payment.amount, 0);
    const stockMovements = await prisma.stockMovement.findMany({
      where: { referenceId: purchase.id, referenceType: { in: ["PURCHASE_RECEIPT", "PURCHASE", "PURCHASE_UPDATE"] } },
      include: { product: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      id: purchase.id,
      supplierId: purchase.supplierId,
      supplierName: purchase.supplier.name,
      purchaseNumber: purchase.invoiceNumber,
      purchaseDate: purchase.purchaseDate,
      total: purchase.totalAmount,
      paidAmount,
      paymentStatus: purchasePaymentStatus(purchase.totalAmount, paidAmount),
      isCompleted: purchase.isCompleted,
      notes: purchase.notes,
      stockMovements: stockMovements.map((movement) => ({
        id: movement.id,
        productName: movement.product.name,
        quantity: movement.quantity,
        quantityChange: movement.quantityChange,
        balanceAfter: movement.balanceAfter,
        referenceType: movement.referenceType,
        createdAt: movement.createdAt,
      })),
      items: purchase.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        quantity: item.quantity,
        rate: item.rate,
        gstPercentage: item.gstPercentage,
        total: item.amount,
      })),
      payments: purchase.payments,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireRole(request, ["OWNER", "STAFF"]);
    if (session instanceof NextResponse) return session;

    const body = await request.json();
    const data = updatePurchaseSchema.parse(body);

    const purchase = await prisma.purchase.findUnique({
      where: { id },
      include: { items: true, payments: true },
    });

    if (!purchase) {
      return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
    }

    if (purchase.payments.length > 0) {
      return NextResponse.json(
        { error: "Cannot update a purchase after payment has been recorded" },
        { status: 400 },
      );
    }

    const lineItems = (data.items ?? purchase.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      rate: item.rate,
      gstPercentage: item.gstPercentage,
    }))).map((item) => {
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

    const updated = await prisma.$transaction(async (tx) => {
      if (purchase.isCompleted) {
        await reversePurchaseStockReceipt(tx, purchase.id, purchase.invoiceNumber);
      }

      await tx.purchaseItem.deleteMany({ where: { purchaseId: id } });

      const result = await tx.purchase.update({
        where: { id },
        data: {
          supplierId: data.supplierId ?? purchase.supplierId,
          purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : purchase.purchaseDate,
          taxableAmount: subtotal,
          totalAmount,
          gstAmount,
          notes: data.notes ?? purchase.notes,
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

      if (purchase.isCompleted) {
        await postPurchaseStockReceipt(
          tx,
          result.id,
          result.invoiceNumber,
          lineItems.map((item) => ({ productId: item.productId, quantity: item.quantity })),
          data.notes ?? purchase.notes,
        );
      }

      return result;
    });

    return NextResponse.json(updated, { status: 200 });
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireRole(request, ["OWNER"]);
    if (session instanceof NextResponse) return session;

    const purchase = await prisma.purchase.findUnique({
      where: { id },
      include: { items: true, payments: true },
    });

    if (!purchase) {
      return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
    }

    if (purchase.payments.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete a purchase that already has supplier payments recorded" },
        { status: 400 },
      );
    }

    await prisma.$transaction(async (tx) => {
      if (purchase.isCompleted) {
        await reversePurchaseStockReceipt(tx, purchase.id, purchase.invoiceNumber);
      }

      await tx.purchaseItem.deleteMany({ where: { purchaseId: id } });
      await tx.purchase.delete({ where: { id } });
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
