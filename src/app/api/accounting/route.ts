import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import {
  classifyInvoiceBucket,
  invoiceRemaining,
  type PaymentBucket,
} from "@/lib/reconciliation";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      salesData,
      expenseData,
      totalReceivables,
      purchaseAggregate,
      ledgerEntries,
      openInvoices,
      suppliersWithPurchases,
    ] = await Promise.all([
      prisma.invoice.findMany({
        where: {
          invoiceDate: { gte: monthStart },
          status: { not: "DRAFT" },
        },
        select: {
          totalAmount: true,
          paidAmount: true,
          paymentType: true,
          invoiceDate: true,
        },
      }),
      prisma.expense.groupBy({
        by: ["category"],
        where: {
          expenseDate: { gte: monthStart },
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
      }),
      prisma.ledger.findMany({
        orderBy: { entryDate: "desc" },
        take: 8,
        include: {
          customer: { select: { name: true } },
        },
      }),
      prisma.invoice.findMany({
        where: { status: { not: "DRAFT" } },
        select: {
          id: true,
          invoiceNumber: true,
          invoiceDate: true,
          dueDate: true,
          totalAmount: true,
          paidAmount: true,
          status: true,
          customer: { select: { id: true, name: true, mobile: true } },
        },
        orderBy: { invoiceDate: "desc" },
        take: 200,
      }),
      prisma.supplier.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          mobile: true,
          purchases: {
            select: {
              id: true,
              invoiceNumber: true,
              totalAmount: true,
              isCompleted: true,
              payments: { select: { amount: true } },
            },
          },
        },
        orderBy: { name: "asc" },
      }),
    ]);

    const totalSales = salesData.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
    const cashSales = salesData
      .filter((invoice) => invoice.paymentType === "CASH")
      .reduce((sum, invoice) => sum + invoice.totalAmount, 0);
    const upiSales = salesData
      .filter((invoice) => invoice.paymentType === "UPI")
      .reduce((sum, invoice) => sum + invoice.totalAmount, 0);
    const creditSales = salesData
      .filter((invoice) => invoice.paymentType === "CREDIT")
      .reduce((sum, invoice) => sum + invoice.totalAmount, 0);

    const totalExpenses = expenseData.reduce((sum, item) => sum + (item._sum.amount ?? 0), 0);
    const totalOutstanding = totalReceivables._sum.outstandingAmount ?? 0;
    const totalPurchases = purchaseAggregate._sum.totalAmount ?? 0;
    const totalSupplierPayments = await prisma.supplierPayment.aggregate({
      _sum: { amount: true },
    });
    const calculatedPayables = Math.max(0, totalPurchases - (totalSupplierPayments._sum.amount ?? 0));
    const netCashFlow = totalSales - totalExpenses;
    const grossMargin = totalSales > 0 ? ((totalSales - totalExpenses) / totalSales) * 100 : 0;

    const expenseBreakdown = expenseData.map((item) => ({
      category: item.category,
      amount: item._sum.amount ?? 0,
    }));

    const ledger = ledgerEntries.map((entry) => ({
      id: entry.id,
      date: entry.entryDate,
      description: entry.description,
      type: entry.ledgerType === "SALES" ? "Credit" : entry.ledgerType === "EXPENSE" ? "Expense" : "Entry",
      amount: entry.debit > 0 ? entry.debit : entry.credit,
      balance: entry.balance,
      customer: entry.customer?.name ?? "System",
    }));

    const bucketTotals: Record<PaymentBucket, { count: number; amount: number }> = {
      paid: { count: 0, amount: 0 },
      due: { count: 0, amount: 0 },
      overdue: { count: 0, amount: 0 },
    };

    const receivableLines = openInvoices.map((invoice) => {
      const remaining = invoiceRemaining(invoice.totalAmount, invoice.paidAmount);
      const bucket = classifyInvoiceBucket(
        invoice.totalAmount,
        invoice.paidAmount,
        invoice.status,
        invoice.dueDate,
        now,
      );
      bucketTotals[bucket].count += 1;
      bucketTotals[bucket].amount += bucket === "paid" ? invoice.totalAmount : remaining;

      return {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        customerId: invoice.customer.id,
        customerName: invoice.customer.name,
        customerMobile: invoice.customer.mobile,
        invoiceDate: invoice.invoiceDate,
        dueDate: invoice.dueDate,
        totalAmount: invoice.totalAmount,
        paidAmount: invoice.paidAmount,
        remaining,
        bucket,
        allocationLabel:
          remaining <= 0
            ? "Fully settled"
            : invoice.paidAmount > 0
              ? "Partial payment applied"
              : "Awaiting payment",
      };
    });

    const customerMap = new Map<
      string,
      {
        id: string;
        name: string;
        mobile: string;
        outstanding: number;
        invoiceCount: number;
        overdueCount: number;
      }
    >();

    for (const line of receivableLines) {
      if (line.remaining <= 0) continue;
      const existing = customerMap.get(line.customerId) ?? {
        id: line.customerId,
        name: line.customerName,
        mobile: line.customerMobile,
        outstanding: 0,
        invoiceCount: 0,
        overdueCount: 0,
      };
      existing.outstanding += line.remaining;
      existing.invoiceCount += 1;
      if (line.bucket === "overdue") existing.overdueCount += 1;
      customerMap.set(line.customerId, existing);
    }

    const supplierSummaries = suppliersWithPurchases
      .map((supplier) => {
        let outstanding = 0;
        let openPurchases = 0;
        let overdueApprovals = 0;

        for (const purchase of supplier.purchases) {
          const paid = purchase.payments.reduce((sum, payment) => sum + payment.amount, 0);
          const remaining = invoiceRemaining(purchase.totalAmount, paid);
          if (remaining > 0) {
            outstanding += remaining;
            openPurchases += 1;
          }
          if (!purchase.isCompleted) overdueApprovals += 1;
        }

        return {
          id: supplier.id,
          name: supplier.name,
          mobile: supplier.mobile,
          outstanding,
          openPurchases,
          pendingReceipts: overdueApprovals,
        };
      })
      .filter((row) => row.outstanding > 0 || row.pendingReceipts > 0)
      .sort((a, b) => b.outstanding - a.outstanding);

    return NextResponse.json({
      summary: {
        receivables: totalOutstanding,
        payables: calculatedPayables,
        cashFlow: netCashFlow,
        grossMargin,
      },
      sales: {
        totalSales,
        cashSales,
        upiSales,
        creditSales,
      },
      expenses: {
        totalExpenses,
        breakdown: expenseBreakdown,
      },
      ledgerEntries: ledger,
      reconciliation: {
        bucketTotals,
        customerSummaries: [...customerMap.values()].sort((a, b) => b.outstanding - a.outstanding),
        supplierSummaries,
        receivableLines: receivableLines.filter((line) => line.remaining > 0),
      },
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
