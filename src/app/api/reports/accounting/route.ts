import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { indiaDateKey, indiaStartOfDay, isValidDateOnly } from "@/lib/date-utils";
import type { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;
    const { searchParams } = new URL(request.url);
    const today = indiaDateKey();
    const fromKey = searchParams.get("from") || `${today.slice(0, 7)}-01`;
    const toKey = searchParams.get("to") || today;
    if (!isValidDateOnly(fromKey) || !isValidDateOnly(toKey) || fromKey > toKey) return NextResponse.json({ error: "Choose a valid YYYY-MM-DD date range" }, { status: 400 });
    const from = indiaStartOfDay(fromKey);
    const endExclusive = indiaStartOfDay(toKey).getTime() + 24 * 60 * 60 * 1000;
    const end = new Date(endExclusive);
    const finalized: Prisma.InvoiceWhereInput = { status: { notIn: ["DRAFT", "CANCELLED"] } };

    const [sales, expenses, allInvoices, receipts, allPurchases, allSupplierPayments, ledger] = await Promise.all([
      prisma.invoice.findMany({ where: { ...finalized, invoiceDate: { gte: from, lt: end } }, select: { totalAmount: true, paidAmount: true, gstAmount: true, invoiceNumber: true, customerName: true, invoiceDate: true } }),
      prisma.expense.groupBy({ by: ["category"], where: { expenseDate: { gte: from, lt: end } }, _sum: { amount: true } }),
      prisma.invoice.findMany({ where: finalized, select: { totalAmount: true, paidAmount: true } }),
      prisma.customerPayment.findMany({ where: { paymentDate: { gte: from, lt: end }, reversedAt: null, invoice: { status: { notIn: ["DRAFT", "CANCELLED"] } } }, select: { amount: true, paymentMethod: true } }),
      prisma.purchase.aggregate({ _sum: { totalAmount: true } }),
      prisma.supplierPayment.aggregate({ _sum: { amount: true } }),
      prisma.ledger.findMany({ where: { entryDate: { gte: from, lt: end } }, orderBy: { entryDate: "desc" }, take: 12, include: { customer: { select: { name: true } } } }),
    ]);

    const totalSales = sales.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
    const totalCollections = receipts.reduce((sum, payment) => sum + payment.amount, 0);
    const cashCollections = receipts.filter((payment) => payment.paymentMethod === "CASH").reduce((sum, payment) => sum + payment.amount, 0);
    const upiCollections = receipts.filter((payment) => payment.paymentMethod === "UPI").reduce((sum, payment) => sum + payment.amount, 0);
    const periodReceivables = sales.reduce((sum, invoice) => sum + Math.max(0, invoice.totalAmount - invoice.paidAmount), 0);
    const totalReceivables = allInvoices.reduce((sum, invoice) => sum + Math.max(0, invoice.totalAmount - invoice.paidAmount), 0);
    const totalExpenses = expenses.reduce((sum, item) => sum + (item._sum.amount ?? 0), 0);
    const totalPayables = Math.max(0, (allPurchases._sum.totalAmount ?? 0) - (allSupplierPayments._sum.amount ?? 0));

    return NextResponse.json({
      period: { from: from.toISOString(), to: new Date(endExclusive - 1).toISOString() },
      summary: { totalSales, totalCollections, totalExpenses, totalReceivables, totalPayables, periodReceivables, collectionsMinusExpenses: totalCollections - totalExpenses },
      salesBreakdown: { cashCollections, upiCollections, periodReceivables },
      expenseBreakdown: expenses.map((item) => ({ category: item.category, amount: item._sum.amount ?? 0 })),
      recentLedger: ledger.map((entry) => ({ id: entry.id, date: entry.entryDate, description: entry.description, type: entry.ledgerType, amount: entry.debit > 0 ? entry.debit : entry.credit, balance: entry.balance, customer: entry.customer?.name ?? "Walk-in / System" })),
    });
  } catch (error) {
    console.error("GET /api/reports/accounting failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
