import { InvoiceType, PaymentType, Prisma } from "@prisma/client";
import { requireAuth, requireRole } from "@/lib/auth-helpers";
import { calculateInvoiceTotals } from "@/lib/invoice-utils";
import { reserveInvoiceNumber } from "@/lib/invoice-number";
import { businessInfo } from "@/lib/business-info";
import { invoiceStatusFromPayments } from "@/lib/reconciliation";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const customerInputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  shopName: z.string().trim().max(200).optional().nullable(),
  mobile: z.string().trim().max(30).optional().nullable(),
  address: z.string().trim().max(500).optional().nullable(),
  gstNumber: z.string().trim().max(20).optional().nullable(),
  stateCode: z.string().regex(/^\d{2}$/).optional().nullable(),
  save: z.boolean().default(false),
});

const invoiceItemSchema = z.object({
  productId: z.string().min(1).nullable().optional(),
  name: z.string().trim().min(1).max(300).optional(),
  sku: z.string().trim().max(100).optional().nullable(),
  hsnCode: z.string().trim().max(20).optional().nullable(),
  unit: z.enum(["KG", "GRAM", "BAG", "PIECE"]).default("PIECE"),
  quantity: z.number().positive().finite(),
  rate: z.number().min(0).finite(),
  discountPercent: z.number().min(0).max(100).default(0),
  discountAmount: z.number().min(0).optional(),
  gstPercent: z.number().min(0).max(100).default(0),
  newProduct: z.object({
    sku: z.string().trim().min(1).max(100),
    categoryId: z.string().min(1),
    purchaseRate: z.number().min(0).finite(),
    initialStock: z.number().min(0).finite(),
    minimumStockLevel: z.number().min(0).finite().default(0),
  }).optional(),
});

const createInvoiceSchema = z.object({
  customerId: z.string().min(1).nullable().optional(),
  customer: customerInputSchema.optional(),
  invoiceDate: z.string().datetime({ offset: true }),
  dueDate: z.string().datetime({ offset: true }).nullable().optional(),
  invoiceType: z.enum(["GST_INVOICE", "NON_GST_INVOICE"]).default("GST_INVOICE"),
  placeOfSupplyStateCode: z.string().regex(/^\d{2}$/).nullable().optional(),
  paymentType: z.enum(["CASH", "UPI", "CREDIT"]).default("CREDIT"),
  amountReceived: z.number().min(0).finite().default(0),
  paymentDate: z.string().datetime({ offset: true }).optional(),
  paymentReference: z.string().trim().max(100).optional(),
  paymentNotes: z.string().trim().max(300).optional(),
  discountAmount: z.number().min(0).finite().default(0),
  deliveryBy: z.string().max(200).optional().or(z.literal("")),
  notes: z.string().max(2000).optional(),
  status: z.enum(["DRAFT", "SENT"]).default("SENT"),
  idempotencyKey: z.string().uuid(),
  items: z.array(invoiceItemSchema).min(1).max(200),
});

function errorResponse(error: unknown) {
  if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid invoice" }, { status: 400 });
  if (error instanceof Error && (error.message.startsWith("VALIDATION:") || error.message.startsWith("STOCK:"))) {
    return NextResponse.json({ error: error.message.split(":").slice(1).join(":").trim() }, { status: 400 });
  }
  if (error instanceof Error && error.message.includes("Unique constraint failed")) {
    return NextResponse.json({ error: "Duplicate invoice or customer details detected" }, { status: 409 });
  }
  console.error("POST /api/invoices failed", error);
  return NextResponse.json({ error: "Failed to save invoice" }, { status: 500 });
}

function mobileMatchKey(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    const invoices = await prisma.invoice.findMany({
      include: { customer: { select: { id: true, name: true, mobile: true } }, createdBy: { select: { name: true } } },
      orderBy: { invoiceDate: "desc" },
    });
    return NextResponse.json(invoices.map((invoice) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.customerName || invoice.customer?.name || "Walk-in Customer",
      customerId: invoice.customerId ?? "",
      total: invoice.totalAmount,
      paidAmount: invoice.paidAmount,
      balanceDue: Math.max(0, invoice.totalAmount - invoice.paidAmount),
      status: invoice.status,
      paymentType: invoice.paymentType,
      gstEnabled: invoice.gstEnabled,
      invoiceDate: invoice.invoiceDate,
      createdAt: invoice.createdAt,
      createdBy: invoice.createdBy?.name,
    })));
  } catch (error) {
    console.error("GET /api/invoices failed", error);
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(request, ["OWNER", "STAFF"]);
    if (session instanceof NextResponse) return session;
    const data = createInvoiceSchema.parse(await request.json());
    const existing = await prisma.invoice.findUnique({ where: { idempotencyKey: data.idempotencyKey } });
    if (existing) return NextResponse.json(existing, { status: 200 });

    const gstEnabled = data.invoiceType === "GST_INVOICE";
    if (data.status === "DRAFT" && data.amountReceived > 0) {
      throw new Error("VALIDATION: Draft invoices cannot record payments");
    }
    if (data.amountReceived > 0 && data.paymentType === "CREDIT") {
      throw new Error("VALIDATION: Select Cash or UPI for a recorded payment");
    }
    if (data.amountReceived > 0 && !data.customerId && !data.customer) {
      throw new Error("VALIDATION: Add customer details before recording a payment");
    }

    const business = await prisma.businessSettings.findUnique({ where: { id: "default" } });
    if (gstEnabled) {
      if (!business?.gstin || !business.registeredStateCode) {
        throw new Error("VALIDATION: Configure supplier GSTIN and registered state in Settings before issuing GST invoices");
      }
      if (!/^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/.test(business.gstin.toUpperCase())) {
        throw new Error("VALIDATION: Supplier GSTIN in Settings is invalid");
      }
      if (business.gstin.slice(0, 2) !== business.registeredStateCode) {
        throw new Error("VALIDATION: Supplier GSTIN state code does not match the registered state in Settings");
      }
    }

    const created = await prisma.$transaction(async (tx) => {
      const duplicate = await tx.invoice.findUnique({ where: { idempotencyKey: data.idempotencyKey } });
      if (duplicate) return duplicate;

      let customerId = data.customerId ?? null;
      let customerSnapshot = {
        name: "Walk-in Customer",
        mobile: null as string | null,
        address: "",
        gstNumber: null as string | null,
        stateCode: null as string | null,
      };

      if (customerId) {
        const customer = await tx.customer.findUnique({ where: { id: customerId } });
        if (!customer) throw new Error("VALIDATION: Selected customer was not found");
        customerSnapshot = { name: customer.name, mobile: customer.mobile, address: customer.address, gstNumber: customer.gstNumber, stateCode: customer.stateCode };
      } else if (data.customer) {
        const mobile = data.customer.mobile?.trim() || null;
        let customer = mobile ? await tx.customer.findUnique({ where: { mobile } }) : null;
        if (!customer && mobile) {
          const matchKey = mobileMatchKey(mobile);
          const nearby = await tx.customer.findMany({ where: { mobile: { contains: matchKey } }, take: 50 });
          customer = nearby.find((candidate) => mobileMatchKey(candidate.mobile) === matchKey) ?? null;
        }
        if (!customer && data.customer.save) {
          if (!mobile) throw new Error("VALIDATION: A mobile number is required to save a customer");
          customer = await tx.customer.create({
            data: {
              name: data.customer.name,
              shopName: data.customer.shopName || null,
              mobile,
              address: data.customer.address || "",
              gstNumber: data.customer.gstNumber || null,
              stateCode: data.customer.stateCode || null,
            },
          });
        }
        customerId = customer?.id ?? null;
        customerSnapshot = customer
          ? { name: customer.name, mobile: customer.mobile, address: customer.address, gstNumber: customer.gstNumber, stateCode: customer.stateCode }
          : { name: data.customer.name, mobile, address: data.customer.address || "", gstNumber: data.customer.gstNumber || null, stateCode: data.customer.stateCode || null };
      }

      const placeOfSupply = data.placeOfSupplyStateCode || customerSnapshot.stateCode || business?.registeredStateCode || null;
      if (gstEnabled && !placeOfSupply) throw new Error("VALIDATION: Select a place of supply for this GST invoice");
      if (gstEnabled && customerSnapshot.gstNumber && !/^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/.test(customerSnapshot.gstNumber.toUpperCase())) {
        throw new Error("VALIDATION: Customer GSTIN is invalid");
      }
      const taxTreatment = gstEnabled && placeOfSupply !== business?.registeredStateCode ? "INTER_STATE" : "INTRA_STATE";

      const resolvedItems: Array<{
        input: z.infer<typeof invoiceItemSchema>;
        product: { id: string; name: string; marathiName: string | null; sku: string; hsnCode: string | null; unit: string; gstPercentage: number; sellingRate: number; currentStock: number } | null;
        rate: number;
        gstPercent: number;
      }> = [];

      for (const input of data.items) {
        let product = input.productId ? await tx.product.findUnique({ where: { id: input.productId } }) : null;
        if (input.productId && !product) throw new Error("VALIDATION: Selected product was not found");
        if (!product && !input.name?.trim()) throw new Error("VALIDATION: Enter a description for the one-time item");
        if (input.newProduct && session.user.role !== "OWNER") throw new Error("VALIDATION: Only an owner can save products to the catalogue");
        if (!product && gstEnabled && session.user.role !== "OWNER") throw new Error("VALIDATION: An owner must verify the GST rate for a one-time item");
        if (!product && input.newProduct) {
          const category = await tx.category.findUnique({ where: { id: input.newProduct.categoryId } });
          if (!category) throw new Error("VALIDATION: Select a valid product category");
          product = await tx.product.create({
            data: {
              name: input.name!,
              sku: input.newProduct.sku,
              categoryId: input.newProduct.categoryId,
              unit: input.unit,
              hsnCode: input.hsnCode || null,
              gstPercentage: input.gstPercent,
              purchaseRate: input.newProduct.purchaseRate,
              sellingRate: input.rate,
              currentStock: input.newProduct.initialStock,
              minimumStockLevel: input.newProduct.minimumStockLevel,
            },
          });
          if (input.newProduct.initialStock > 0) {
            await tx.stockMovement.create({ data: {
              productId: product.id,
              movementType: "STOCK_IN",
              quantity: input.newProduct.initialStock,
              quantityChange: input.newProduct.initialStock,
              balanceAfter: input.newProduct.initialStock,
              referenceType: "INITIAL_STOCK",
              notes: "Initial quantity entered while adding product during billing",
            } });
          }
        }

        let rate = input.rate;
        let gstPercent = gstEnabled ? input.gstPercent : 0;
        if (product) {
          gstPercent = gstEnabled ? product.gstPercentage : 0;
          if (session.user.role !== "OWNER") {
            const previousSale = customerId
              ? await tx.invoiceItem.findFirst({
                  where: { productId: product.id, invoice: { customerId, status: { notIn: ["DRAFT", "CANCELLED"] } } },
                  orderBy: { invoice: { invoiceDate: "desc" } },
                  select: { rate: true },
                })
              : null;
            rate = previousSale?.rate ?? product.sellingRate;
          }
        } else if (!input.name?.trim()) {
          throw new Error("VALIDATION: Enter a description for the one-time item");
        }
        if (!gstEnabled) gstPercent = 0;
        resolvedItems.push({ input, product, rate, gstPercent });
      }

      const calcInput = resolvedItems.map(({ input, product, rate, gstPercent }) => ({
        productId: product?.id ?? null,
        productName: product ? (product.marathiName ? `${product.marathiName} (${product.name})` : product.name) : input.name,
        productSku: product?.sku ?? input.sku ?? null,
        hsnCode: product?.hsnCode ?? input.hsnCode ?? null,
        unit: product?.unit ?? input.unit,
        quantity: input.quantity,
        rate,
        discountPercent: input.discountPercent,
        discountAmount: input.discountAmount,
        gstPercent,
      }));
      const totals = calculateInvoiceTotals(calcInput, data.discountAmount, gstEnabled, taxTreatment);
      if (data.amountReceived > totals.totalAmount) throw new Error("VALIDATION: Amount received cannot exceed the invoice total");

      const invoiceNumber = await reserveInvoiceNumber(tx);
      const status = data.status === "DRAFT"
        ? "DRAFT"
        : invoiceStatusFromPayments(totals.totalAmount, data.amountReceived);
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          idempotencyKey: data.idempotencyKey,
          customerId,
          customerName: customerSnapshot.name,
          customerMobile: customerSnapshot.mobile,
          customerAddress: customerSnapshot.address,
          customerGstNumber: customerSnapshot.gstNumber,
          customerStateCode: customerSnapshot.stateCode,
          placeOfSupplyStateCode: placeOfSupply,
          supplierName: business?.legalName ?? businessInfo.nameEnglish,
          supplierAddress: business?.address ?? businessInfo.address,
          supplierGstin: business?.gstin ?? null,
          supplierPhones: business?.phoneNumbers.length ? business.phoneNumbers : [...businessInfo.phones],
          invoiceDate: new Date(data.invoiceDate),
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          invoiceType: data.invoiceType as InvoiceType,
          paymentType: (data.amountReceived > 0 ? data.paymentType : "CREDIT") as PaymentType,
          gstEnabled,
          subtotal: totals.subtotal,
          discountAmount: totals.discountAmount,
          discountPercent: 0,
          taxableAmount: totals.taxableAmount,
          gstAmount: totals.gstAmount,
          cgstAmount: totals.cgstAmount,
          sgstAmount: totals.sgstAmount,
          igstAmount: totals.igstAmount,
          totalAmount: totals.totalAmount,
          paidAmount: data.status === "DRAFT" ? 0 : data.amountReceived,
          status,
          deliveryBy: data.deliveryBy?.trim() || null,
          notes: data.notes?.trim() || null,
          createdById: session.user.id,
          items: {
            create: totals.calculatedItems.map((item) => ({
              productId: item.productId,
              productName: item.productName ?? "Item",
              productSku: item.productSku,
              hsnCode: item.hsnCode,
              unit: item.unit ?? "PIECE",
              quantity: item.quantity,
              rate: item.rate,
              discountPercent: item.discountPercent ?? 0,
              discountAmount: item.discountAmount ?? 0,
              gstPercent: gstEnabled ? item.gstPercent : 0,
              amount: item.amount,
              lineSubtotal: item.lineSubtotal,
              taxableAmount: item.lineTaxable,
              cgstAmount: item.cgstAmount,
              sgstAmount: item.sgstAmount,
              igstAmount: item.igstAmount,
            })),
          },
        },
        include: { items: true },
      });

      if (data.status !== "DRAFT") {
        const quantities = new Map<string, number>();
        for (const item of totals.calculatedItems) {
          if (item.productId) quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
        }
        for (const [productId, quantity] of quantities) {
          const changed = await tx.$executeRaw`UPDATE "Product" SET "currentStock" = "currentStock" - ${quantity} WHERE "id" = ${productId} AND "isActive" = TRUE AND "currentStock" >= ${quantity}`;
          if (changed !== 1) {
            const product = await tx.product.findUnique({ where: { id: productId }, select: { name: true, currentStock: true, unit: true } });
            throw new Error(`STOCK: Insufficient stock for ${product?.name ?? "product"}. Available: ${product?.currentStock ?? 0} ${product?.unit ?? ""}`);
          }
          const product = await tx.product.findUniqueOrThrow({ where: { id: productId }, select: { currentStock: true } });
          await tx.stockMovement.create({ data: {
            productId,
            movementType: "SALE",
            quantity,
            quantityChange: -quantity,
            balanceAfter: product.currentStock,
            referenceId: invoice.id,
            referenceType: "INVOICE",
            notes: `Invoice ${invoiceNumber}`,
          } });
        }

        if (customerId) {
          await tx.ledger.create({ data: {
            customerId,
            entryDate: new Date(data.invoiceDate),
            description: `Invoice ${invoiceNumber}`,
            debit: totals.totalAmount,
            credit: 0,
            balance: 0,
            ledgerType: "SALES",
          } });
        }

        if (data.amountReceived > 0) {
          const payment = await tx.customerPayment.create({ data: {
            invoiceId: invoice.id,
            customerId,
            amount: data.amountReceived,
            paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(data.invoiceDate),
            paymentMethod: data.paymentType,
            reference: data.paymentReference || null,
            idempotencyKey: `${data.idempotencyKey}:initial`,
            notes: data.paymentNotes || null,
          } });
          if (customerId) {
            await tx.ledger.create({ data: {
              customerId,
              entryDate: payment.paymentDate,
              description: `Payment received for invoice ${invoiceNumber}`,
              debit: 0,
              credit: payment.amount,
              balance: 0,
              ledgerType: "RECEIPT",
            } });
          }
        }

        if (customerId) {
          const receivableInvoices = await tx.invoice.findMany({ where: { customerId, status: { not: "CANCELLED" } }, select: { totalAmount: true, paidAmount: true } });
          const outstanding = receivableInvoices.reduce((sum, row) => sum + Math.max(0, row.totalAmount - row.paidAmount), 0);
          await tx.customer.update({ where: { id: customerId }, data: { outstandingAmount: outstanding } });
          await tx.ledger.updateMany({ where: { customerId, description: { in: [`Invoice ${invoiceNumber}`, `Payment received for invoice ${invoiceNumber}`] } }, data: { balance: outstanding } });
        }
      }

      return invoice;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
