import { requireAuth, requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updateProductSchema = z.object({
  name: z.string().optional(),
  marathiName: z.string().optional(),
  categoryId: z.string().optional(),
  unit: z.enum(["KG", "GRAM", "BAG", "PIECE"]).optional(),
  hsnCode: z.string().optional(),
  gstPercentage: z.number().optional(),
  purchaseRate: z.number().optional(),
  sellingRate: z.number().optional(),
  minimumStockLevel: z.number().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        stockMovements: { orderBy: { createdAt: "desc" }, take: 20 },
        rateHistories: { orderBy: { date: "desc" }, take: 12 },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
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
    const session = await requireRole(request, ["OWNER"]);
    if (session instanceof NextResponse) return session;

    const body = await request.json();
    const data = updateProductSchema.parse(body);

    const product = await prisma.product.update({
      where: { id },
      data,
      include: { category: true },
    });

    return NextResponse.json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
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

    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
