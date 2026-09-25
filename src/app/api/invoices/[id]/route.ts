import { requireAuth, requireRole } from "@/lib/auth-helpers";
import {
  calculateInvoiceTotals,
  generateInvoiceNumber,
} from "@/lib/invoice-utils";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        items: { include: { product: { include: { category: true } } } },
        createdBy: { select: { name: true, role: true } },
        payments: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch {
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

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      if (invoice.status !== "DRAFT") {
        for (const item of invoice.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: { increment: item.quantity } },
          });

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              movementType: "STOCK_IN",
              quantity: item.quantity,
              referenceId: invoice.id,
              referenceType: "INVOICE_DELETE",
              notes: `Reversed from deleted invoice ${invoice.invoiceNumber}`,
            },
          });
        }

        if (invoice.paymentType === "CREDIT") {
          const invoiceTotals = await tx.invoice.findMany({
            where: { customerId: invoice.customerId },
            select: { totalAmount: true, paidAmount: true },
          });
          const nextOutstanding = invoiceTotals.reduce(
            (sum, currentInvoice) => sum + Math.max(0, currentInvoice.totalAmount - currentInvoice.paidAmount),
            0,
          );

          await tx.customer.update({
            where: { id: invoice.customerId },
            data: { outstandingAmount: nextOutstanding },
          });
        }
      }

      await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });
      await tx.customerPayment.deleteMany({ where: { invoiceId: id } });
      await tx.invoice.delete({ where: { id } });
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireRole(request, ["OWNER", "STAFF"]);
    if (session instanceof NextResponse) return session;

    const url = new URL(request.url);
    const action = url.searchParams.get("action");

    if (action !== "duplicate") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const original = await prisma.invoice.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!original) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const items = original.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      rate: item.rate,
      discountPercent: item.discountPercent,
      discountAmount: item.discountAmount,
      gstPercent: item.gstPercent,
    }));

    const { calculatedItems, subtotal, taxableAmount, gstAmount, totalAmount } =
      calculateInvoiceTotals(items, original.discountAmount, original.gstEnabled);

    const invoiceNumber = await generateInvoiceNumber();

    const duplicate = await prisma.invoice.create({
      data: {
        invoiceNumber,
        customerId: original.customerId,
        invoiceDate: new Date(),
        invoiceType: original.invoiceType,
        paymentType: original.paymentType,
        gstEnabled: original.gstEnabled,
        subtotal,
        discountAmount: original.discountAmount,
        discountPercent: original.discountPercent,
        taxableAmount,
        gstAmount,
        totalAmount,
        status: "DRAFT",
        notes: original.notes,
        createdById: session.user.id,
        items: {
          create: calculatedItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            rate: item.rate,
            discountPercent: item.discountPercent ?? 0,
            discountAmount: item.discountAmount ?? item.lineDiscount,
            gstPercent: original.gstEnabled ? item.gstPercent : 0,
            amount: item.amount,
          })),
        },
      },
      include: {
        customer: true,
        items: { include: { product: true } },
      },
    });

    return NextResponse.json(duplicate, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
