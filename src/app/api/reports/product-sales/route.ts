import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { indiaDateKey, indiaStartOfDay, isValidDateOnly } from "@/lib/date-utils";
import { NextRequest, NextResponse } from "next/server";

function dateKey(value: string | null, fallback: string) {
  const result = value || fallback;
  if (!isValidDateOnly(result)) return null;
  return result;
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;
    const today = indiaDateKey();
    const { searchParams } = new URL(request.url);
    const fromKey = dateKey(searchParams.get("from"), `${today.slice(0, 7)}-01`);
    const toKey = dateKey(searchParams.get("to"), today);
    if (!fromKey || !toKey || fromKey > toKey) return NextResponse.json({ error: "Choose a valid YYYY-MM-DD date range" }, { status: 400 });
    const from = indiaStartOfDay(fromKey);
    const toExclusive = indiaStartOfDay(toKey).getTime() + 24 * 60 * 60 * 1000;

    const items = await prisma.invoiceItem.findMany({
      where: {
        invoice: {
          invoiceDate: { gte: from, lt: new Date(toExclusive) },
          status: { notIn: ["DRAFT", "CANCELLED"] },
        },
      },
      include: {
        product: { include: { category: true } },
        invoice: { select: { invoiceNumber: true, invoiceDate: true } },
      },
    });
    const productMap = new Map<string, {
      productId: string;
      name: string;
      marathiName: string | null;
      category: string;
      totalQuantity: number;
      totalAmount: number;
      invoiceCount: number;
    }>();

    for (const item of items) {
      const key = item.productId ?? `one-time:${item.productName}`;
      const existing = productMap.get(key);
      if (existing) {
        existing.totalQuantity += item.quantity;
        existing.totalAmount += item.amount;
        existing.invoiceCount += 1;
      } else {
        productMap.set(key, {
          productId: item.productId ?? "",
          name: item.productName || item.product?.name || "Item",
          marathiName: item.product?.marathiName ?? null,
          category: item.product?.category?.name ?? (item.productId ? "Discontinued product" : "One-time item"),
          totalQuantity: item.quantity,
          totalAmount: item.amount,
          invoiceCount: 1,
        });
      }
    }

    const products = Array.from(productMap.values()).sort((a, b) => b.totalAmount - a.totalAmount);
    return NextResponse.json({
      from: from.toISOString(),
      to: new Date(toExclusive - 1).toISOString(),
      products,
      totalRevenue: products.reduce((sum, product) => sum + product.totalAmount, 0),
    });
  } catch (error) {
    console.error("GET /api/reports/product-sales failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
