import { requireAuth, requireRole } from "@/lib/auth-helpers";
import { calculateInvoiceTotals } from "@/lib/invoice-utils";
import { businessInfo } from "@/lib/business-info";
import { reserveInvoiceNumber } from "@/lib/invoice-number";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

function isPrismaUniqueViolation(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function isUniqueViolationOn(error: Prisma.PrismaClientKnownRequestError, field: string): boolean {
  const target = error.meta?.target;
  return Array.isArray(target)
    ? target.some((value) => value === field)
    : typeof target === "string" && target.toLowerCase().includes(field.toLowerCase());
}

async function retryInvoiceNumberCollision<T>(operation: () => Promise<T>, retries = 2): Promise<T> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (!isPrismaUniqueViolation(error) || !isUniqueViolationOn(error, "invoiceNumber") || attempt >= retries) {
        throw error;
      }
      console.warn("Invoice number collision; retrying atomic allocation", { attempt: attempt + 1 });
    }
  }
}

const createInvoiceSchema = z.object({
  customerId: z.string().min(1).nullable().optional(),
  customer: z.object({
    name: z.string().trim().min(1),
    shopName: z.string().trim().optional(),
    mobile: z.string().trim().optional(),
    address: z.string().trim().optional(),
    gstNumber: z.string().trim().optional(),
    stateCode: z.string().trim().optional(),
    save: z.boolean().optional(),
  }).optional(),
  invoiceDate: z.string().transform((s) => new Date(s)).optional(),
  dueDate: z.string().transform((s) => new Date(s)).nullable().optional(),
  invoiceType: z.enum(["GST_INVOICE", "NON_GST_INVOICE"]).default("GST_INVOICE"),
  placeOfSupplyStateCode: z.string().trim().optional().nullable(),
  paymentType: z.enum(["CASH", "UPI", "CREDIT"]).default("CREDIT"),
  idempotencyKey: z.string().optional(),
  notes: z.string().trim().optional(),
  status: z.enum(["DRAFT", "SENT"]).default("DRAFT"),
  items: z.array(z.object({
      productId: z.string().min(1).nullable().optional(),
      name: z.string().trim().optional(),
      sku: z.string().trim().optional(),
      hsnCode: z.string().trim().optional(),
      unit: z.string().trim().optional(),
      quantity: z.number().positive(),
      rate: z.number().nonnegative(),
      discountAmount: z.number().nonnegative().default(0),
      gstPercent: z.number().nonnegative().default(5),
    })).min(1),
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
  let requestIdempotencyKey: string | undefined;
  try {
    const session = await requireRole(request, ["OWNER", "STAFF"]);
    if (session instanceof NextResponse) return session;

    const body = await request.json();
    const data = createInvoiceSchema.parse(body);
    requestIdempotencyKey = data.idempotencyKey;

    if (data.items.some((item) => !item.productId && !item.name?.trim())) {
      return NextResponse.json({ error: "Every invoice item needs a product or description" }, { status: 400 });
    }

    if (data.idempotencyKey) {
      const existing = await prisma.invoice.findUnique({
        where: { idempotencyKey: data.idempotencyKey },
        include: { customer: true, items: { include: { product: true } } },
      });
      if (existing) return NextResponse.json(existing, { status: 200 });
    }

    const gstEnabled = data.invoiceType === "GST_INVOICE";
    const crossState = Boolean(
      data.placeOfSupplyStateCode &&
      data.placeOfSupplyStateCode !== businessInfo.registeredStateCode,
    );
    const totals = calculateInvoiceTotals(
      data.items.map((item) => ({
        productId: item.productId,
        productName: item.name,
        productSku: item.sku,
        hsnCode: item.hsnCode,
        unit: item.unit,
        quantity: item.quantity,
        rate: item.rate,
        discountAmount: item.discountAmount,
        gstPercent: gstEnabled ? item.gstPercent : 0,
      })),
      data.discountAmount,
      gstEnabled,
      crossState ? "INTER_STATE" : "INTRA_STATE",
    );

    const invoice = await retryInvoiceNumberCollision(() => prisma.$transaction(async (tx) => {
      let customerId = data.customerId;
      let customerDetails = data.customer;

      if (customerDetails && customerDetails.save !== false) {
        if (!customerDetails.mobile?.trim()) {
          throw new Error("CUSTOMER_MOBILE_REQUIRED");
        }
        const existingCustomer = await tx.customer.findUnique({
          where: { mobile: customerDetails.mobile },
        });
        const customer = existingCustomer
          ? await tx.customer.update({
              where: { id: existingCustomer.id },
              data: {
                name: customerDetails.name,
                shopName: customerDetails.shopName || null,
                address: customerDetails.address || "Not provided",
                gstNumber: customerDetails.gstNumber || null,
                stateCode: customerDetails.stateCode || null,
              },
            })
          : await tx.customer.create({
              data: {
                name: customerDetails.name,
                mobile: customerDetails.mobile,
                shopName: customerDetails.shopName || null,
                address: customerDetails.address || "Not provided",
                gstNumber: customerDetails.gstNumber || null,
                stateCode: customerDetails.stateCode || null,
              },
            });
        customerId = customer.id;
        customerDetails = {
          name: customer.name,
          mobile: customer.mobile,
          address: customer.address,
          gstNumber: customer.gstNumber ?? undefined,
          stateCode: customer.stateCode ?? undefined,
        };
      }
      if (!customerDetails && customerId) {
        const selectedCustomer = await tx.customer.findUnique({
          where: { id: customerId },
          select: { name: true, mobile: true, address: true, gstNumber: true, stateCode: true },
        });
        if (!selectedCustomer) throw new Error("INVALID_CUSTOMER");
        customerDetails = {
          name: selectedCustomer.name,
          mobile: selectedCustomer.mobile,
          address: selectedCustomer.address,
          gstNumber: selectedCustomer.gstNumber ?? undefined,
          stateCode: selectedCustomer.stateCode ?? undefined,
        };
      }

      const productDetails = await Promise.all(data.items.map((item) =>
        item.productId
          ? tx.product.findUnique({
              where: { id: item.productId },
              select: { name: true, sku: true, hsnCode: true, unit: true },
            })
          : null,
      ));

      if (data.items.some((item, index) => item.productId && !productDetails[index])) {
        throw new Error("INVALID_PRODUCT");
      }

      return tx.invoice.create({
        data: {
          invoiceNumber: await reserveInvoiceNumber(tx),
          customerId,
          customerName: customerDetails?.name,
          customerMobile: customerDetails?.mobile,
          customerAddress: customerDetails?.address,
          customerGstNumber: customerDetails?.gstNumber,
          customerStateCode: customerDetails?.stateCode,
          supplierName: businessInfo.nameEnglish,
          supplierAddress: businessInfo.address,
          supplierGstin: businessInfo.gstin,
          supplierPhones: [...businessInfo.phones],
          invoiceDate: data.invoiceDate ?? new Date(),
          dueDate: data.dueDate,
          invoiceType: data.invoiceType,
          placeOfSupplyStateCode: data.placeOfSupplyStateCode,
          paymentType: data.paymentType,
          gstEnabled,
          idempotencyKey: data.idempotencyKey,
          notes: data.notes,
          subtotal: totals.subtotal,
          discountAmount: totals.discountAmount,
          discountPercent: data.discountPercent,
          taxableAmount: totals.taxableAmount,
          gstAmount: totals.gstAmount,
          cgstAmount: totals.cgstAmount,
          sgstAmount: totals.sgstAmount,
          igstAmount: totals.igstAmount,
          totalAmount: totals.totalAmount,
          status: "DRAFT",
          items: {
            create: totals.calculatedItems.map((item, index) => {
              const product = productDetails[index];
              return {
                productId: item.productId,
                productName: item.productName || product?.name || "Item",
                productSku: item.productSku || product?.sku,
                hsnCode: item.hsnCode || product?.hsnCode,
                unit: item.unit || product?.unit || "PIECE",
                quantity: item.quantity,
                rate: item.rate,
                discountPercent: item.discountPercent,
                discountAmount: item.discountAmount,
                gstPercent: item.gstPercent,
                amount: item.amount,
                lineSubtotal: item.lineSubtotal,
                taxableAmount: item.lineTaxable,
                cgstAmount: item.cgstAmount,
                sgstAmount: item.sgstAmount,
                igstAmount: item.igstAmount,
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
    }));

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
    if (error instanceof Error && error.message === "CUSTOMER_MOBILE_REQUIRED") {
      return NextResponse.json(
        { error: "A mobile number is required to save this customer" },
        { status: 400 },
      );
    }
    if (error instanceof Error && error.message === "INVALID_CUSTOMER") {
      return NextResponse.json(
        { error: "The selected customer could not be found" },
        { status: 400 },
      );
    }

    if (isPrismaUniqueViolation(error)) {
      if (requestIdempotencyKey) {
        try {
          const existing = await prisma.invoice.findUnique({
            where: { idempotencyKey: requestIdempotencyKey },
            include: { customer: true, items: { include: { product: true } } },
          });
          if (existing) return NextResponse.json(existing, { status: 200 });
        } catch (lookupError) {
          console.error("POST /api/invoices idempotency recovery lookup failed", lookupError);
          return NextResponse.json(
            { error: "Could not confirm whether the invoice was saved. Retry with the same request." },
            { status: 500 },
          );
        }
      }

      const invoiceNumberCollision = isUniqueViolationOn(error, "invoiceNumber");
      console.error("POST /api/invoices unique constraint conflict", {
        target: error.meta?.target,
      });
      return NextResponse.json(
        {
          error: invoiceNumberCollision
            ? "An invoice number conflict occurred. Please retry the same save."
            : "An invoice with these details already exists. Please retry the same save.",
        },
        { status: 409 },
      );
    }

    console.error("POST /api/invoices failed", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
