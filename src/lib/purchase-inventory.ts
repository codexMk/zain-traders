import type { Prisma } from "@prisma/client";

export async function postPurchaseStockReceipt(
  tx: Prisma.TransactionClient,
  purchaseId: string,
  invoiceNumber: string,
  items: { productId: string; quantity: number }[],
  notes?: string | null,
) {
  const existing = await tx.stockMovement.findFirst({
    where: {
      referenceId: purchaseId,
      referenceType: { in: ["PURCHASE_RECEIPT", "PURCHASE"] },
    },
  });
  if (existing) return;

  for (const item of items) {
    const product = await tx.product.findUnique({ where: { id: item.productId } });
    if (!product) {
      throw new Error(`Product not found: ${item.productId}`);
    }

    const nextBalance = Number((product.currentStock + item.quantity).toFixed(2));

    await tx.product.update({
      where: { id: item.productId },
      data: { currentStock: nextBalance },
    });

    await tx.stockMovement.create({
      data: {
        productId: item.productId,
        movementType: "PURCHASE",
        quantity: item.quantity,
        quantityChange: item.quantity,
        balanceAfter: nextBalance,
        referenceId: purchaseId,
        referenceType: "PURCHASE_RECEIPT",
        reason: "Purchase receipt confirmed",
        notes: notes ?? `Purchase ${invoiceNumber}`,
        status: "POSTED",
      },
    });
  }
}

export async function reversePurchaseStockReceipt(
  tx: Prisma.TransactionClient,
  purchaseId: string,
  invoiceNumber: string,
) {
  const movements = await tx.stockMovement.findMany({
    where: { referenceId: purchaseId, referenceType: "PURCHASE_RECEIPT" },
  });
  if (movements.length === 0) return;

  for (const movement of movements) {
    const product = await tx.product.findUnique({ where: { id: movement.productId } });
    if (!product) continue;

    const nextBalance = Number((product.currentStock - movement.quantity).toFixed(2));

    await tx.product.update({
      where: { id: movement.productId },
      data: { currentStock: nextBalance },
    });

    await tx.stockMovement.create({
      data: {
        productId: movement.productId,
        movementType: "STOCK_OUT",
        quantity: movement.quantity,
        quantityChange: -movement.quantity,
        balanceAfter: nextBalance,
        referenceId: purchaseId,
        referenceType: "PURCHASE_RECEIPT_REVERSAL",
        reason: "Purchase approval reversed",
        notes: `Reversal for ${invoiceNumber}`,
        status: "POSTED",
      },
    });
  }
}
