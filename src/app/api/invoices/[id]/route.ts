import { requireAuth, requireRole } from "@/lib/auth-helpers";
import { generateInvoiceNumber } from "@/lib/invoice-number";
import { invoiceStatusFromPayments } from "@/lib/reconciliation";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
        payments: { orderBy: { paymentDate: "asc" } },
      },
    });
    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    return NextResponse.json(invoice);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole(request, ["OWNER"]);
  if (session instanceof NextResponse) return session;
  const { id } = await params;
  try {
    const body = await request.json().catch(() => ({}));
    const reason = typeof body.reason === "string" && body.reason.trim() ? body.reason.trim().slice(0, 500) : "Cancelled by owner";
    const invoice = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Invoice" WHERE "id" = ${id} FOR UPDATE`;
      const current = await tx.invoice.findUnique({ where: { id }, include: { items: true, payments: true } });
      if (!current) throw new Error("NOT_FOUND: Invoice not found");
      if (current.status === "CANCELLED") return current;
      const activePayments = current.payments.filter((payment) => !payment.reversedAt);
      if (activePayments.length) throw new Error("INVALID: Reverse recorded payments first, then cancel the invoice");
      if (current.status !== "DRAFT" && current.paidAmount > 0) {
        throw new Error("INVALID: This invoice has a legacy paid balance without active payment records. Reconcile its payment history before cancelling it");
      }

      if (current.status !== "DRAFT") {
        const quantities = new Map<string, number>();
        for (const item of current.items) if (item.productId) quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
        for (const [productId, quantity] of quantities) {
          const product = await tx.product.findUnique({ where: { id: productId }, select: { currentStock: true } });
          if (!product) continue;
          const nextStock = product.currentStock + quantity;
          await tx.product.update({ where: { id: productId }, data: { currentStock: nextStock } });
          await tx.stockMovement.create({ data: {
            productId,
            movementType: "STOCK_IN",
            quantity,
            quantityChange: quantity,
            balanceAfter: nextStock,
            referenceId: current.id,
            referenceType: "INVOICE_CANCELLATION",
            reason,
            notes: `Stock restored from cancelled invoice ${current.invoiceNumber}`,
          } });
        }
        if (current.customerId) {
          await tx.ledger.create({ data: {
            customerId: current.customerId,
            entryDate: new Date(),
            description: `Invoice ${current.invoiceNumber} cancelled: ${reason}`,
            debit: 0,
            credit: current.totalAmount,
            balance: 0,
            ledgerType: "SALES_REVERSAL",
          } });
        }
      }

      const cancelled = await tx.invoice.update({ where: { id }, data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelledById: session.user.id,
        cancellationReason: reason,
      } });
      if (current.customerId) {
        const remaining = await tx.invoice.findMany({ where: { customerId: current.customerId, status: { not: "CANCELLED" } }, select: { totalAmount: true, paidAmount: true } });
        const outstanding = remaining.reduce((sum, row) => sum + Math.max(0, row.totalAmount - row.paidAmount), 0);
        await tx.customer.update({ where: { id: current.customerId }, data: { outstandingAmount: outstanding } });
        await tx.ledger.updateMany({ where: { customerId: current.customerId, description: { contains: current.invoiceNumber } }, data: { balance: outstanding } });
      }
      return cancelled;
    }, { isolationLevel: "Serializable" });
    return NextResponse.json({ success: true, invoice });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("NOT_FOUND:")) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    if (error instanceof Error && error.message.startsWith("INVALID:")) return NextResponse.json({ error: error.message.split(":")[1].trim() }, { status: 400 });
    console.error("DELETE /api/invoices/[id] failed", error);
    return NextResponse.json({ error: "Could not cancel invoice" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await requireRole(request, ["OWNER", "STAFF"]);
    if (session instanceof NextResponse) return session;
    const action = new URL(request.url).searchParams.get("action");
    if (action === "finalize") {
      const body = z.object({
        amountReceived: z.number().min(0).finite().default(0),
        paymentType: z.enum(["CASH", "UPI"]).default("CASH"),
        paymentDate: z.string().datetime({ offset: true }).optional(),
        paymentReference: z.string().trim().max(100).optional(),
        paymentNotes: z.string().trim().max(300).optional(),
      }).parse(await request.json());
      const finalized = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT "id" FROM "Invoice" WHERE "id" = ${id} FOR UPDATE`;
        const draft = await tx.invoice.findUnique({ where: { id }, include: { items: true } });
        if (!draft) throw new Error("NOT_FOUND: Invoice not found");
        if (draft.status !== "DRAFT") return draft;
        if (draft.gstEnabled && (!draft.supplierGstin || !draft.placeOfSupplyStateCode)) throw new Error("INVALID: Complete supplier GSTIN and place of supply before finalizing this GST invoice");
        if (body.amountReceived > draft.totalAmount) throw new Error("INVALID: Amount received cannot exceed the invoice total");
        const quantities = new Map<string, number>();
        for (const item of draft.items) if (item.productId) quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
        for (const [productId, quantity] of quantities) {
          const changed = await tx.$executeRaw`UPDATE "Product" SET "currentStock" = "currentStock" - ${quantity} WHERE "id" = ${productId} AND "isActive" = TRUE AND "currentStock" >= ${quantity}`;
          if (changed !== 1) {
            const product = await tx.product.findUnique({ where: { id: productId }, select: { name: true, currentStock: true, unit: true } });
            throw new Error(`INVALID: Insufficient stock for ${product?.name ?? "product"}. Available: ${product?.currentStock ?? 0} ${product?.unit ?? ""}`);
          }
          const product = await tx.product.findUniqueOrThrow({ where: { id: productId }, select: { currentStock: true } });
          await tx.stockMovement.create({ data: { productId, movementType: "SALE", quantity, quantityChange: -quantity, balanceAfter: product.currentStock, referenceId: id, referenceType: "INVOICE", notes: `Invoice ${draft.invoiceNumber}` } });
        }
        const status = invoiceStatusFromPayments(draft.totalAmount, body.amountReceived);
        const updated = await tx.invoice.update({ where: { id }, data: {
          status,
          paymentType: body.amountReceived > 0 ? body.paymentType : "CREDIT",
          paidAmount: body.amountReceived,
        } });
        if (draft.customerId) await tx.ledger.create({ data: { customerId: draft.customerId, entryDate: draft.invoiceDate, description: `Invoice ${draft.invoiceNumber}`, debit: draft.totalAmount, credit: 0, balance: 0, ledgerType: "SALES" } });
        if (body.amountReceived > 0) {
          const payment = await tx.customerPayment.create({ data: {
            invoiceId: id,
            customerId: draft.customerId,
            amount: body.amountReceived,
            paymentDate: body.paymentDate ? new Date(body.paymentDate) : new Date(),
            paymentMethod: body.paymentType,
            reference: body.paymentReference || null,
            idempotencyKey: `finalize:${id}`,
            notes: body.paymentNotes || null,
          } });
          if (draft.customerId) await tx.ledger.create({ data: { customerId: draft.customerId, entryDate: payment.paymentDate, description: `Payment received for invoice ${draft.invoiceNumber}`, debit: 0, credit: payment.amount, balance: 0, ledgerType: "RECEIPT" } });
        }
        if (draft.customerId) {
          const balances = await tx.invoice.findMany({ where: { customerId: draft.customerId, status: { not: "CANCELLED" } }, select: { totalAmount: true, paidAmount: true } });
          const outstanding = balances.reduce((sum, row) => sum + Math.max(0, row.totalAmount - row.paidAmount), 0);
          await tx.customer.update({ where: { id: draft.customerId }, data: { outstandingAmount: outstanding } });
          await tx.ledger.updateMany({ where: { customerId: draft.customerId, description: { in: [`Invoice ${draft.invoiceNumber}`, `Payment received for invoice ${draft.invoiceNumber}`] } }, data: { balance: outstanding } });
        }
        return updated;
      }, { isolationLevel: "Serializable" });
      return NextResponse.json(finalized, { status: 200 });
    }
    if (action !== "duplicate") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
    const original = await prisma.invoice.findUnique({ where: { id }, include: { items: true } });
    if (!original) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    const invoiceNumber = await generateInvoiceNumber();
    const duplicate = await prisma.invoice.create({
      data: {
        invoiceNumber,
        customerId: original.customerId,
        customerName: original.customerName,
        customerMobile: original.customerMobile,
        customerAddress: original.customerAddress,
        customerGstNumber: original.customerGstNumber,
        customerStateCode: original.customerStateCode,
        placeOfSupplyStateCode: original.placeOfSupplyStateCode,
        supplierName: original.supplierName,
        supplierAddress: original.supplierAddress,
        supplierGstin: original.supplierGstin,
        supplierPhones: original.supplierPhones,
        invoiceDate: new Date(),
        invoiceType: original.invoiceType,
        paymentType: "CREDIT",
        gstEnabled: original.gstEnabled,
        subtotal: original.subtotal,
        discountAmount: original.discountAmount,
        discountPercent: original.discountPercent,
        taxableAmount: original.taxableAmount,
        gstAmount: original.gstAmount,
        cgstAmount: original.cgstAmount,
        sgstAmount: original.sgstAmount,
        igstAmount: original.igstAmount,
        totalAmount: original.totalAmount,
        paidAmount: 0,
        status: "DRAFT",
        deliveryBy: original.deliveryBy,
        notes: original.notes,
        createdById: session.user.id,
        items: { create: original.items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          productSku: item.productSku,
          hsnCode: item.hsnCode,
          unit: item.unit,
          quantity: item.quantity,
          rate: item.rate,
          discountPercent: item.discountPercent,
          discountAmount: item.discountAmount,
          gstPercent: item.gstPercent,
          amount: item.amount,
          lineSubtotal: item.lineSubtotal,
          taxableAmount: item.taxableAmount,
          cgstAmount: item.cgstAmount,
          sgstAmount: item.sgstAmount,
          igstAmount: item.igstAmount,
        })) },
      },
      include: { items: true },
    });
    return NextResponse.json(duplicate, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
    if (error instanceof Error && (error.message.startsWith("INVALID:") || error.message.startsWith("NOT_FOUND:"))) {
      return NextResponse.json({ error: error.message.split(":").slice(1).join(":").trim() }, { status: error.message.startsWith("NOT_FOUND:") ? 404 : 400 });
    }
    console.error("POST /api/invoices/[id] failed", error);
    return NextResponse.json({ error: "Could not duplicate invoice" }, { status: 500 });
  }
}
