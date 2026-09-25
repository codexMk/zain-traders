import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        category: true,
        stockMovements: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
      orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
    });

    const inventory = products.map((p) => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      marathiName: p.marathiName,
      category: p.category.name,
      unit: p.unit,
      currentStock: p.currentStock,
      minimumStockLevel: p.minimumStockLevel,
      isLowStock: p.currentStock <= p.minimumStockLevel,
      stockValue: p.currentStock * p.purchaseRate,
      purchaseRate: p.purchaseRate,
      sellingRate: p.sellingRate,
      recentMovements: p.stockMovements.map((m) => ({
        type: m.movementType,
        quantity: m.quantity,
        date: m.createdAt,
        notes: m.notes,
      })),
    }));

    return NextResponse.json({
      totalProducts: inventory.length,
      lowStockCount: inventory.filter((p) => p.isLowStock).length,
      totalStockValue: inventory.reduce((sum, p) => sum + p.stockValue, 0),
      products: inventory,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
