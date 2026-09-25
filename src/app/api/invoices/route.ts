import { requireAuth, requireRole } from "@/lib/auth-helpers";
import {
  calculateInvoiceTotals,
  generateInvoiceNumber,
} from "@/lib/invoice-utils";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const createInvoiceSchema = z.object({
  customerId: z.string().min(1),
  invoiceDate: z.string().transform((s) => new Date(s)),
  dueDate: z.string().transform((s) => new Date(s)).optional(),
  invoiceType: z.enum(["GST_INVOICE", "NON_GST_INVOICE"]).default("GST_INVOICE"),
  paymentType: z.enum(["CASH", "UPI", "CREDIT"]).default("CASH"),
  gstEnabled: z.boolean().default(true),
  discountAmount: z.number().default(0),
  discountPercent: z.number().default(0),
  notes: z.string().optional(),
  status: z.enum(["DRAFT", "SENT", "PAID"]).default("SENT"),
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().positive(),
        rate: z.number().min(0),
        discountPercent: z.number().default(0),
        discountAmount: z.number().default(0),
        gstPercent: z.number().default(5),
      })
    )
    .min(1),
});

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    const invoices = await prisma.invoice.findMany({
      include: {
        customer: { select: { id: true, name: true, mobile: true } },
        items: { include: { product: true } },
        createdBy: { select: { name: true } },
      },
      orderBy: { invoiceDate: "desc" },
    });

    const formatted = invoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      customerName: inv.customer.name,
      customerId: inv.customer.id,
      total: inv.totalAmount,
      paidAmount: inv.paidAmount,
      status: inv.status,
      paymentType: inv.paymentType,
      gstEnabled: inv.gstEnabled,
      invoiceDate: inv.invoiceDate,
      createdAt: inv.createdAt,
      createdBy: inv.createdBy?.name,
    }));

    return NextResponse.json(formatted);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(request, ["OWNER", "STAFF"]);
    if (session instanceof NextResponse) return session;

    const body = await request.json();
    const data = createInvoiceSchema.parse(body);

    const gstEnabled =
      data.gstEnabled && data.invoiceType === "GST_INVOICE";

    const { calculatedItems, subtotal, taxableAmount, gstAmount, totalAmount } =
      calculateInvoiceTotals(data.items, data.discountAmount, gstEnabled);

    const invoiceNumber = await generateInvoiceNumber();
    const userId = session.user.id;

    const invoice = await prisma.$transaction(async (tx) => {
      for (const item of calculatedItems) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });
        if (!product) {
          throw new Error(`Product not found: ${item.productId}`);
        }
        if (data.status !== "DRAFT" && product.currentStock < item.quantity) {
          throw new Error(
            `Insufficient stock for ${product.marathiName || product.name}. Available: ${product.currentStock}`
          );
        }
      }

      const created = await tx.invoice.create({
        data: {
          invoiceNumber,
          customerId: data.customerId,
          invoiceDate: data.invoiceDate,
          dueDate: data.dueDate,
          invoiceType: data.invoiceType,
          paymentType: data.paymentType,
          gstEnabled,
          subtotal,
          discountAmount: data.discountAmount,
          discountPercent: data.discountPercent,
          taxableAmount,
          gstAmount,
          totalAmount,
          paidAmount: data.paymentType === "CREDIT" ? 0 : totalAmount,
          status:
            data.paymentType === "CREDIT" ? "SENT" : data.status === "DRAFT" ? "DRAFT" : "PAID",
          notes: data.notes,
          createdById: userId,
          items: {
            create: calculatedItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              rate: item.rate,
              discountPercent: item.discountPercent ?? 0,
              discountAmount: item.discountAmount ?? item.lineDiscount,
              gstPercent: gstEnabled ? item.gstPercent : 0,
              amount: item.amount,
            })),
          },
        },
        include: {
          customer: true,
          items: { include: { product: { include: { category: true } } } },
        },
      });

      if (data.status !== "DRAFT") {
        for (const item of calculatedItems) {
          const currentProduct = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (!currentProduct) {
            throw new Error(`Product not found: ${item.productId}`);
          }

          const nextBalance = currentProduct.currentStock - item.quantity;
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: nextBalance },
          });

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              movementType: "SALE",
              quantity: item.quantity,
              quantityChange: -item.quantity,
              balanceAfter: nextBalance,
              referenceId: created.id,
              referenceType: "INVOICE",
              notes: `Invoice ${invoiceNumber}`,
            },
          });
        }

        if (data.paymentType === "CREDIT") {
          const invoiceTotals = await tx.invoice.findMany({
            where: { customerId: data.customerId },
            select: { totalAmount: true, paidAmount: true },
          });
          const nextOutstanding = invoiceTotals.reduce(
            (sum, invoice) => sum + Math.max(0, invoice.totalAmount - invoice.paidAmount),
            0,
          );

          await tx.customer.update({
            where: { id: data.customerId },
            data: { outstandingAmount: nextOutstanding },
          });

          await tx.ledger.create({
            data: {
              customerId: data.customerId,
              entryDate: data.invoiceDate,
              description: `Credit Invoice ${invoiceNumber}`,
              debit: totalAmount,
              credit: 0,
              balance: nextOutstanding,
              ledgerType: "SALES",
            },
          });
        }
      }

      return created;
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
