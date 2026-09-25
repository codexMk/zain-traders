import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    const { searchParams } = new URL(request.url);
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    const from = fromParam
      ? new Date(fromParam)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const to = toParam ? new Date(toParam) : new Date();
    to.setHours(23, 59, 59, 999);

    const items = await prisma.invoiceItem.findMany({
      where: {
        invoice: {
          invoiceDate: { gte: from, lte: to },
          status: { not: "DRAFT" },
        },
      },
      include: {
        product: { include: { category: true } },
        invoice: { select: { invoiceNumber: true, invoiceDate: true } },
      },
    });

    const productMap = new Map<
      string,
      {
        productId: string;
        name: string;
        marathiName: string | null;
        category: string;
        totalQuantity: number;
        totalAmount: number;
        invoiceCount: number;
      }
    >();

    items.forEach((item) => {
      const key = item.productId;
      const existing = productMap.get(key);
      if (existing) {
        existing.totalQuantity += item.quantity;
        existing.totalAmount += item.amount;
        existing.invoiceCount += 1;
      } else {
        productMap.set(key, {
          productId: item.productId,
          name: item.product.name,
          marathiName: item.product.marathiName,
          category: item.product.category.name,
          totalQuantity: item.quantity,
          totalAmount: item.amount,
          invoiceCount: 1,
        });
      }
    });

    const products = Array.from(productMap.values()).sort(
      (a, b) => b.totalAmount - a.totalAmount
    );

    return NextResponse.json({
      from: from.toISOString(),
      to: to.toISOString(),
      products,
      totalRevenue: products.reduce((sum, p) => sum + p.totalAmount, 0),
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
