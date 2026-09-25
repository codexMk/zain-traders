import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    const { searchParams } = new URL(request.url);
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    const from = fromParam ? new Date(fromParam) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const to = toParam ? new Date(toParam) : new Date();
    to.setHours(23, 59, 59, 999);

    const [salesInvoices, purchaseInvoices] = await Promise.all([
      prisma.invoice.findMany({
        where: {
          invoiceDate: { gte: from, lte: to },
          status: { not: "DRAFT" },
        },
        select: {
          invoiceType: true,
          totalAmount: true,
          taxableAmount: true,
          gstAmount: true,
          paidAmount: true,
          paymentType: true,
          invoiceNumber: true,
          customer: { select: { name: true } },
        },
      }),
      prisma.purchase.findMany({
        where: {
          purchaseDate: { gte: from, lte: to },
        },
        select: {
          invoiceNumber: true,
          totalAmount: true,
          taxableAmount: true,
          gstAmount: true,
          supplier: { select: { name: true } },
        },
      }),
    ]);

    const totalSales = salesInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
    const taxableSales = salesInvoices.reduce((sum, invoice) => sum + invoice.taxableAmount, 0);
    const gstCollected = salesInvoices.reduce((sum, invoice) => sum + invoice.gstAmount, 0);
    const cashSales = salesInvoices.filter((invoice) => invoice.paymentType === "CASH").reduce((sum, invoice) => sum + invoice.totalAmount, 0);
    const upiSales = salesInvoices.filter((invoice) => invoice.paymentType === "UPI").reduce((sum, invoice) => sum + invoice.totalAmount, 0);
    const creditSales = salesInvoices.filter((invoice) => invoice.paymentType === "CREDIT").reduce((sum, invoice) => sum + invoice.totalAmount, 0);
    const totalPurchases = purchaseInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
    const inputTax = purchaseInvoices.reduce((sum, invoice) => sum + invoice.gstAmount, 0);
    const netTaxLiability = gstCollected - inputTax;

    return NextResponse.json({
      period: {
        from: from.toISOString(),
        to: to.toISOString(),
      },
      summary: {
        totalSales,
        taxableSales,
        gstCollected,
        totalPurchases,
        inputTax,
        netTaxLiability,
        cashSales,
        upiSales,
        creditSales,
      },
      invoiceBreakdown: salesInvoices.map((invoice) => ({
        invoiceNumber: invoice.invoiceNumber,
        customer: invoice.customer.name,
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
