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
          take: 3,
        },
      },
      orderBy: { name: "asc" },
    });

    const inventory = products.map((p) => ({
      id: p.id,
      name: p.name,
      marathiName: p.marathiName,
      sku: p.sku,
      category: p.category.name,
      unit: p.unit,
      currentStock: p.currentStock,
      minimumStockLevel: p.minimumStockLevel,
      isLowStock: p.currentStock <= p.minimumStockLevel,
      purchaseRate: p.purchaseRate,
      sellingRate: p.sellingRate,
      recentMovements: p.stockMovements,
    }));

    const summary = {
      totalProducts: products.length,
      lowStockCount: inventory.filter((p) => p.isLowStock).length,
      totalStockValue: products.reduce(
        (sum, p) => sum + p.currentStock * p.purchaseRate,
        0
      ),
    };

    return NextResponse.json({ summary, inventory });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
