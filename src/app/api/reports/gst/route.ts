import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { indiaDateKey, indiaStartOfDay, isValidDateOnly } from "@/lib/date-utils";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    const { searchParams } = new URL(request.url);
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    const today = indiaDateKey();
    const fromKey = fromParam || `${today.slice(0, 7)}-01`;
    const toKey = toParam || today;
    if (!isValidDateOnly(fromKey) || !isValidDateOnly(toKey) || fromKey > toKey) {
      return NextResponse.json({ error: "Choose a valid YYYY-MM-DD date range" }, { status: 400 });
    }
    const from = indiaStartOfDay(fromKey);
    const toExclusive = indiaStartOfDay(toKey).getTime() + 24 * 60 * 60 * 1000;

    const [salesInvoices, purchaseInvoices, payments] = await Promise.all([
      prisma.invoice.findMany({
        where: {
          invoiceDate: { gte: from, lt: new Date(toExclusive) },
          status: { notIn: ["DRAFT", "CANCELLED"] },
        },
        select: {
          invoiceType: true,
          totalAmount: true,
          taxableAmount: true,
          gstAmount: true,
          paidAmount: true,
          invoiceNumber: true,
          customerName: true,
        },
      }),
      prisma.purchase.findMany({
        where: {
          purchaseDate: { gte: from, lt: new Date(toExclusive) },
        },
        select: {
          invoiceNumber: true,
          totalAmount: true,
          taxableAmount: true,
          gstAmount: true,
          supplier: { select: { name: true } },
        },
      }),
      prisma.customerPayment.findMany({
        where: { paymentDate: { gte: from, lt: new Date(toExclusive) }, reversedAt: null, invoice: { status: { notIn: ["DRAFT", "CANCELLED"] } } },
        select: { amount: true, paymentMethod: true },
      }),
    ]);

    const totalSales = salesInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
    const taxableSales = salesInvoices.reduce((sum, invoice) => sum + invoice.taxableAmount, 0);
    const gstCollected = salesInvoices.reduce((sum, invoice) => sum + invoice.gstAmount, 0);
    const cashCollections = payments.filter((payment) => payment.paymentMethod === "CASH").reduce((sum, payment) => sum + payment.amount, 0);
    const upiCollections = payments.filter((payment) => payment.paymentMethod === "UPI").reduce((sum, payment) => sum + payment.amount, 0);
    const outstandingSales = salesInvoices.reduce((sum, invoice) => sum + Math.max(0, invoice.totalAmount - invoice.paidAmount), 0);
    const totalPurchases = purchaseInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
    const inputTax = purchaseInvoices.reduce((sum, invoice) => sum + invoice.gstAmount, 0);
    const netTaxLiability = gstCollected - inputTax;

    return NextResponse.json({
      period: {
        from: from.toISOString(),
        to: new Date(toExclusive - 1).toISOString(),
      },
      summary: {
        totalSales,
        taxableSales,
        gstCollected,
        totalPurchases,
        inputTax,
        netTaxLiability,
        cashCollections,
        upiCollections,
        outstandingSales,
      },
      invoiceBreakdown: salesInvoices.map((invoice) => ({
        invoiceNumber: invoice.invoiceNumber,
        customer: invoice.customerName || "Walk-in Customer",
        type: invoice.invoiceType,
        taxableAmount: invoice.taxableAmount,
        gstAmount: invoice.gstAmount,
        totalAmount: invoice.totalAmount,
      })),
      purchaseBreakdown: purchaseInvoices.map((invoice) => ({
        invoiceNumber: invoice.invoiceNumber,
        supplier: invoice.supplier.name,
        taxableAmount: invoice.taxableAmount,
        gstAmount: invoice.gstAmount,
        totalAmount: invoice.totalAmount,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
