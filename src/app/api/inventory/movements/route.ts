import { requireAuth, requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const movementSchema = z.object({
  productId: z.string().min(1),
  movementType: z.enum(["STOCK_IN", "STOCK_OUT", "DAMAGED", "ADJUSTMENT"]),
  quantity: z.number().positive(),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    const movements = await prisma.stockMovement.findMany({
      where: productId ? { productId } : undefined,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            marathiName: true,
            sku: true,
            unit: true,
            currentStock: true,
            minimumStockLevel: true,
            category: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: productId ? 50 : 100,
    });

    return NextResponse.json(movements);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(request, ["OWNER"]);
    if (session instanceof NextResponse) return session;

    const body = await request.json();
    const data = movementSchema.parse(body);

    const product = await prisma.product.findUnique({
      where: { id: data.productId },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const isOut =
      data.movementType === "STOCK_OUT" || data.movementType === "DAMAGED";

    if (isOut && product.currentStock < data.quantity) {
      return NextResponse.json(
        { error: `Insufficient stock. Available: ${product.currentStock}` },
        { status: 400 }
      );
    }

    const movement = await prisma.$transaction(async (tx) => {
      const productSnapshot = await tx.product.findUnique({
        where: { id: data.productId },
      });

      if (!productSnapshot) {
        throw new Error("Product not found");
      }

      const quantityChange = isOut ? -data.quantity : data.quantity;
      const nextBalance = productSnapshot.currentStock + quantityChange;

      if (nextBalance < 0) {
        throw new Error(`Insufficient stock. Available: ${productSnapshot.currentStock}`);
      }

      const created = await tx.stockMovement.create({
        data: {
          productId: data.productId,
          movementType: data.movementType,
          quantity: data.quantity,
          quantityChange,
          balanceAfter: nextBalance,
          referenceType: "MANUAL",
          notes: data.notes,
        },
        include: { product: true },
      });

      await tx.product.update({
        where: { id: data.productId },
        data: {
          currentStock: nextBalance,
        },
      });

      return created;
    });

    return NextResponse.json(movement, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
