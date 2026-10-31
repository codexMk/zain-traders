import { requireAuth, requireRole } from "@/lib/auth-helpers";
import { reserveInvoiceNumber } from "@/lib/invoice-number";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const createInvoiceSchema = z.object({
  invoiceNumber: z.string().min(1).optional(),
  customerId: z.string().min(1).optional(),
  customer: z.object({
    name: z.string().trim().min(1),
    mobile: z.string().trim().min(1),
    address: z.string().trim().min(1),
    gstNumber: z.string().trim().optional(),
  }).optional(),
  invoiceDate: z.string().transform((s) => new Date(s)).optional(),
  dueDate: z.string().transform((s) => new Date(s)).nullable().optional(),
  invoiceType: z.enum(["GST_INVOICE", "NON_GST_INVOICE"]).default("GST_INVOICE"),
  items: z.array(z.object({
      productId: z.string().min(1),
      quantity: z.number().positive(),
      rate: z.number().nonnegative(),
      gstPercent: z.number().nonnegative(),
    })).min(1),
  discountAmount: z.number().default(0),
  discountPercent: z.number().default(0),
}).refine((data) => Boolean(data.customerId || data.customer), {
  message: "Enter customer details",
  path: ["customer"],
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

    const invoice = await prisma.$transaction(async (tx) => {
      let customerId = data.customerId;
      let customerDetails = data.customer;

      if (customerDetails) {
        const existingCustomer = await tx.customer.findUnique({
          where: { mobile: customerDetails.mobile },
        });
        const customer = existingCustomer
          ? await tx.customer.update({
              where: { id: existingCustomer.id },
              data: {
                name: customerDetails.name,
                address: customerDetails.address,
                gstNumber: customerDetails.gstNumber || null,
              },
            })
          : await tx.customer.create({
              data: {
                name: customerDetails.name,
                mobile: customerDetails.mobile,
                address: customerDetails.address,
                gstNumber: customerDetails.gstNumber || null,
              },
            });
        customerId = customer.id;
        customerDetails = {
          name: customer.name,
          mobile: customer.mobile,
          address: customer.address,
          gstNumber: customer.gstNumber ?? undefined,
        };
      }

      const productDetails = await Promise.all(items.map((item) =>
        tx.product.findUnique({
          where: { id: item.productId },
          select: { name: true, sku: true, hsnCode: true, unit: true },
        }),
      ));

      if (productDetails.some((product) => !product)) {
        throw new Error("INVALID_PRODUCT");
      }

      return tx.invoice.create({
        data: {
          invoiceNumber: data.invoiceNumber ?? await reserveInvoiceNumber(tx),
          customerId,
          customerName: customerDetails?.name,
          customerMobile: customerDetails?.mobile,
          customerAddress: customerDetails?.address,
          customerGstNumber: customerDetails?.gstNumber,
          invoiceDate: data.invoiceDate ?? new Date(),
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
            create: items.map((item, index) => {
              const product = productDetails[index];
              if (!product) throw new Error("INVALID_PRODUCT");
              return {
                ...item,
                productName: product.name,
                productSku: product.sku,
                hsnCode: product.hsnCode,
                unit: product.unit,
              };
            }),
          },
        },
        include: {
          customer: true,
          items: {
            include: { product: true },
          },
        },
      });
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message === "INVALID_PRODUCT") {
      return NextResponse.json(
        { error: "One or more selected products could not be found" },
        { status: 400 }
      );
    }

    console.error("POST /api/invoices failed", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
