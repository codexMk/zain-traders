import { requireAuth, requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const createInvoiceSchema = z.object({
  invoiceNumber: z.string().min(1),
  customerId: z.string().min(1),
  invoiceDate: z.string().transform((s) => new Date(s)),
  dueDate: z.string().transform((s) => new Date(s)).optional(),
  invoiceType: z.enum(["GST_INVOICE", "NON_GST_INVOICE"]).default("GST_INVOICE"),
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number(),
      rate: z.number(),
      gstPercent: z.number(),
    })
  ),
  discountAmount: z.number().default(0),
  discountPercent: z.number().default(0),
});

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    const invoices = await prisma.invoice.findMany({
      include: {
        customer: {
          select: { name: true },
        },
      },
      orderBy: { invoiceDate: "desc" },
    });

    return NextResponse.json(
      invoices.map((invoice) => ({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        customerName: invoice.customer?.name ?? invoice.customerName,
        total: invoice.totalAmount,
        status: invoice.status,
        createdAt: invoice.createdAt,
      }))
    );
  } catch (error) {
    console.error("GET /api/invoices failed", error);
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
    const data = createInvoiceSchema.parse(body);

    // Calculate totals
    let subtotal = 0;
    const items = data.items.map((item) => {
      const amount = item.quantity * item.rate;
      subtotal += amount;
      return { ...item, amount };
    });

    const taxableAmount = subtotal - data.discountAmount;
    let gstAmount = 0;
    items.forEach((item) => {
      gstAmount += (item.amount * item.gstPercent) / 100;
    });

    const totalAmount = taxableAmount + gstAmount;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: data.invoiceNumber,
        customerId: data.customerId,
        invoiceDate: data.invoiceDate,
        dueDate: data.dueDate,
        invoiceType: data.invoiceType,
        subtotal,
        discountAmount: data.discountAmount,
        discountPercent: data.discountPercent,
        taxableAmount,
        gstAmount,
        totalAmount,
        status: "DRAFT",
        items: {
          create: items,
        },
      },
      include: {
        customer: true,
        items: {
          include: { product: true },
        },
      },
    });

    return NextResponse.json(invoice, { status: 201 });
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
