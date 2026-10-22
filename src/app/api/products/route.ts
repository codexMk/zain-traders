import { requireAuth, requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const createProductSchema = z.object({
  name: z.string().min(1),
  marathiName: z.string().optional(),
  sku: z.string().min(1),
  categoryId: z.string().min(1),
  unit: z.enum(["KG", "GRAM", "BAG", "PIECE"]),
  hsnCode: z.string().optional(),
  gstPercentage: z.number().default(5),
  purchaseRate: z.number(),
  sellingRate: z.number(),
  minimumStockLevel: z.number().default(0),
});

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const customerId = searchParams.get("customerId");

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { marathiName: { contains: search, mode: "insensitive" } },
                { sku: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: { category: true },
      orderBy: { name: "asc" },
      take: search ? 20 : 500,
    });

    const lastRates = new Map<string, number>();
    const recentSales = await prisma.invoiceItem.findMany({
      where: {
        productId: { in: products.map((product) => product.id) },
        invoice: {
          status: { notIn: ["DRAFT", "CANCELLED"] },
          ...(customerId ? { customerId } : {}),
        },
      },
      orderBy: { invoice: { invoiceDate: "desc" } },
      take: 50,
      select: { productId: true, rate: true },
    });
    const recentIds: string[] = [];
    for (const sale of recentSales) {
      if (!sale.productId) continue;
      if (customerId && !lastRates.has(sale.productId)) lastRates.set(sale.productId, sale.rate);
      if (!recentIds.includes(sale.productId)) recentIds.push(sale.productId);
    }
    if (customerId) {
      const sales = await prisma.invoiceItem.findMany({
        where: {
          productId: { in: products.map((product) => product.id) },
          invoice: { customerId, status: { notIn: ["DRAFT", "CANCELLED"] } },
        },
        orderBy: { invoice: { invoiceDate: "desc" } },
        select: { productId: true, rate: true },
      });
      for (const sale of sales) {
        if (sale.productId && !lastRates.has(sale.productId)) lastRates.set(sale.productId, sale.rate);
      }
    }
    const recentOrder = new Map(recentIds.map((id, index) => [id, index]));
    products.sort((left, right) => (recentOrder.get(left.id) ?? 1_000) - (recentOrder.get(right.id) ?? 1_000));
    return NextResponse.json(products.map((product) => ({
      ...product,
      lastSellingRate: lastRates.get(product.id) ?? null,
    })));
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(request, ["OWNER"]);
    if (session instanceof NextResponse) return session;

    const body = await request.json();
    const data = createProductSchema.parse(body);

    const product = await prisma.product.create({
      data: {
        ...data,
        currentStock: 0,
      },
      include: { category: true },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
