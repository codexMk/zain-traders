import { requireRole } from "@/lib/auth-helpers";
import { postPurchaseStockReceipt, reversePurchaseStockReceipt } from "@/lib/purchase-inventory";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const approvalSchema = z.object({
  approved: z.boolean().default(true),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireRole(request, ["OWNER", "ACCOUNTANT", "STAFF"]);
    if (session instanceof NextResponse) return session;

    const body = await request.json();
    const data = approvalSchema.parse(body);

    const purchase = await prisma.purchase.findUnique({
      where: { id },
      include: { supplier: true, items: true },
    });

    if (!purchase) {
      return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (data.approved && !purchase.isCompleted) {
        await postPurchaseStockReceipt(
          tx,
          purchase.id,
          purchase.invoiceNumber,
          purchase.items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
          purchase.notes,
        );

        await tx.ledger.create({
          data: {
            supplierId: purchase.supplierId,
            entryDate: new Date(),
            description: `Purchase receipt confirmed for ${purchase.invoiceNumber}`,
            debit: purchase.totalAmount,
            credit: 0,
            balance: purchase.totalAmount,
            ledgerType: "PURCHASE_APPROVAL",
          },
        });
      }

      if (!data.approved && purchase.isCompleted) {
        await reversePurchaseStockReceipt(tx, purchase.id, purchase.invoiceNumber);
      }

      const result = await tx.purchase.update({
        where: { id },
        data: {
          isCompleted: data.approved,
        },
      });

      return result;
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
