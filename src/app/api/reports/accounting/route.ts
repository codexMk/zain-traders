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

    const [salesData, expenseData, customerSummary, purchaseSummary, supplierPayments, recentLedger] = await Promise.all([
      prisma.invoice.findMany({
        where: {
          invoiceDate: { gte: from, lte: to },
          status: { not: "DRAFT" },
        },
        select: {
          totalAmount: true,
          paidAmount: true,
          paymentType: true,
          gstAmount: true,
          invoiceNumber: true,
          customer: { select: { name: true } },
          invoiceDate: true,
        },
      }),
      prisma.expense.groupBy({
        by: ["category"],
        where: {
          expenseDate: { gte: from, lte: to },
        },
        _sum: {
          amount: true,
        },
      }),
      prisma.customer.aggregate({
        _sum: {
          outstandingAmount: true,
        },
      }),
      prisma.purchase.aggregate({
        _sum: {
          totalAmount: true,
        },
        where: {
          purchaseDate: { gte: from, lte: to },
        },
      }),
      prisma.supplierPayment.aggregate({
        _sum: {
          amount: true,
        },
        where: {
          paymentDate: { gte: from, lte: to },
        },
      }),
      prisma.ledger.findMany({
        where: {
          entryDate: { gte: from, lte: to },
        },
        orderBy: { entryDate: "desc" },
        take: 12,
        include: {
          customer: { select: { name: true } },
        },
      }),
    ]);

    const totalSales = salesData.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
    const cashSales = salesData.filter((invoice) => invoice.paymentType === "CASH").reduce((sum, invoice) => sum + invoice.totalAmount, 0);
    const upiSales = salesData.filter((invoice) => invoice.paymentType === "UPI").reduce((sum, invoice) => sum + invoice.totalAmount, 0);
    const creditSales = salesData.filter((invoice) => invoice.paymentType === "CREDIT").reduce((sum, invoice) => sum + invoice.totalAmount, 0);
    const totalExpenses = expenseData.reduce((sum, item) => sum + (item._sum.amount ?? 0), 0);
    const totalReceivables = customerSummary._sum.outstandingAmount ?? 0;
    const totalPurchases = purchaseSummary._sum.totalAmount ?? 0;
    const totalSupplierPayments = supplierPayments._sum.amount ?? 0;
    const totalPayables = Math.max(0, totalPurchases - totalSupplierPayments);
    const netProfit = totalSales - totalExpenses;
    const grossMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;

    return NextResponse.json({
      period: {
        from: from.toISOString(),
        to: to.toISOString(),
      },
      summary: {
        totalSales,
        totalExpenses,
        netProfit,
        totalReceivables,
        totalPayables,
        grossMargin,
        cashFlow: totalSales - totalExpenses,
      },
      salesBreakdown: {
        cashSales,
        upiSales,
        creditSales,
      },
      expenseBreakdown: expenseData.map((item) => ({
        category: item.category,
        amount: item._sum.amount ?? 0,
      })),
      recentLedger: recentLedger.map((entry) => ({
        id: entry.id,
        date: entry.entryDate,
        description: entry.description,
        type: entry.ledgerType,
        amount: entry.debit > 0 ? entry.debit : entry.credit,
        balance: entry.balance,
        customer: entry.customer?.name ?? "System",
      })),
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
