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

    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(products.map(({ category, ...product }) => ({
      ...product,
      category: category.name,
      categoryId: category.id,
    })));
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(request, ["OWNER", "STAFF"]);
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

    return NextResponse.json({
      ...product,
      category: product.category.name,
      categoryId: product.category.id,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
