import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { indiaDateKey, indiaStartOfDay, isValidDateOnly } from "@/lib/date-utils";
import { NextRequest, NextResponse } from "next/server";

const dateKey = (date: Date) => indiaDateKey(date);
const shiftDay = (key: string, amount: number) => {
  const date = new Date(`${key}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
};
const startAtIndia = (key: string) => indiaStartOfDay(key);
const monthKey = (key: string) => key.slice(0, 7);
const shiftMonth = (key: string, amount: number) => {
  const date = new Date(`${key}-01T12:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + amount);
  return date.toISOString().slice(0, 7);
};

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;
    const today = dateKey(new Date());
    const search = request.nextUrl.searchParams;
    const fromParam = search.get("from");
    const toParam = search.get("to");
    if ((fromParam && !isValidDateOnly(fromParam)) || (toParam && !isValidDateOnly(toParam))) {
      return NextResponse.json({ error: "Use YYYY-MM-DD for the date range" }, { status: 400 });
    }
    const rangeFrom = fromParam || today;
    const rangeTo = toParam || rangeFrom;
    if (rangeFrom > rangeTo) return NextResponse.json({ error: "Start date must be on or before end date" }, { status: 400 });
    const rangeStart = startAtIndia(rangeFrom);
    const rangeEnd = startAtIndia(shiftDay(rangeTo, 1));
    const todayStart = startAtIndia(today);
    const tomorrowStart = startAtIndia(shiftDay(today, 1));
    const weekStart = startAtIndia(shiftDay(today, -6));
    const monthStart = startAtIndia(`${today.slice(0, 7)}-01`);
    const salesWhere: Prisma.InvoiceWhereInput = { status: { notIn: ["DRAFT", "CANCELLED"] } };

    const monthLabels = Array.from({ length: 6 }, (_, index) => shiftMonth(monthKey(today), index - 5));
    const trendStart = startAtIndia(`${monthLabels[0]}-01`);
    const [
      rangeInvoices,
      todayInvoices,
      weekInvoices,
      monthInvoices,
      trendInvoices,
      rangePayments,
      trendPayments,
      allReceivables,
      totalCustomers,
      lowStock,
      recentInvoices,
      rangeItems,
    ] = await Promise.all([
      prisma.invoice.findMany({ where: { ...salesWhere, invoiceDate: { gte: rangeStart, lt: rangeEnd } }, select: { id: true, invoiceNumber: true, customerId: true, customerName: true, invoiceDate: true, totalAmount: true, paidAmount: true, status: true } }),
      prisma.invoice.findMany({ where: { ...salesWhere, invoiceDate: { gte: todayStart, lt: tomorrowStart } }, select: { totalAmount: true } }),
      prisma.invoice.findMany({ where: { ...salesWhere, invoiceDate: { gte: weekStart, lt: tomorrowStart } }, select: { totalAmount: true } }),
      prisma.invoice.findMany({ where: { ...salesWhere, invoiceDate: { gte: monthStart, lt: tomorrowStart } }, select: { totalAmount: true } }),
      prisma.invoice.findMany({ where: { ...salesWhere, invoiceDate: { gte: trendStart, lt: tomorrowStart } }, select: { invoiceDate: true, totalAmount: true } }),
      prisma.customerPayment.findMany({ where: { paymentDate: { gte: rangeStart, lt: rangeEnd }, reversedAt: null, invoice: { status: { notIn: ["DRAFT", "CANCELLED"] } } }, select: { amount: true } }),
      prisma.customerPayment.findMany({ where: { paymentDate: { gte: trendStart, lt: tomorrowStart }, reversedAt: null, invoice: { status: { notIn: ["DRAFT", "CANCELLED"] } } }, select: { paymentDate: true, amount: true } }),
      prisma.invoice.findMany({ where: salesWhere, select: { totalAmount: true, paidAmount: true } }),
      prisma.customer.count({ where: { isActive: true } }),
      prisma.product.findMany({ where: { isActive: true }, include: { category: true }, orderBy: { currentStock: "asc" } }),
      prisma.invoice.findMany({ where: salesWhere, take: 5, orderBy: { createdAt: "desc" }, select: { id: true, invoiceNumber: true, customerName: true, totalAmount: true, invoiceDate: true, status: true } }),
      prisma.invoiceItem.findMany({ where: { invoice: { ...salesWhere, invoiceDate: { gte: rangeStart, lt: rangeEnd } } }, select: { productId: true, productName: true, quantity: true, amount: true } }),
    ]);

    const outstanding = allReceivables.reduce((sum, invoice) => sum + Math.max(0, invoice.totalAmount - invoice.paidAmount), 0);
    const rangeCollections = rangePayments.reduce((sum, payment) => sum + payment.amount, 0);
    const productMap = new Map<string, { name: string; quantity: number; value: number }>();
    for (const item of rangeItems) {
      const key = item.productId ?? `one-time:${item.productName}`;
      const previous = productMap.get(key) ?? { name: item.productName || "Item", quantity: 0, value: 0 };
      productMap.set(key, { name: previous.name, quantity: previous.quantity + item.quantity, value: previous.value + item.amount });
    }
    const customerMap = new Map<string, { id: string; name: string; purchaseValue: number; invoiceCount: number }>();
    for (const invoice of rangeInvoices) {
      if (!invoice.customerId) continue;
      const previous = customerMap.get(invoice.customerId) ?? { id: invoice.customerId, name: invoice.customerName || "Customer", purchaseValue: 0, invoiceCount: 0 };
      customerMap.set(invoice.customerId, { ...previous, purchaseValue: previous.purchaseValue + invoice.totalAmount, invoiceCount: previous.invoiceCount + 1 });
    }
    const salesByMonth = new Map<string, number>();
    const collectionsByMonth = new Map<string, number>();
    for (const key of monthLabels) { salesByMonth.set(key, 0); collectionsByMonth.set(key, 0); }
    for (const invoice of trendInvoices) {
      const key = monthKey(dateKey(invoice.invoiceDate));
      salesByMonth.set(key, (salesByMonth.get(key) ?? 0) + invoice.totalAmount);
    }
    for (const payment of trendPayments) {
      const key = monthKey(dateKey(payment.paymentDate));
      collectionsByMonth.set(key, (collectionsByMonth.get(key) ?? 0) + payment.amount);
    }
    const dailyLabels = Array.from({ length: 7 }, (_, index) => shiftDay(today, index - 6));
    const dailySales = new Map(dailyLabels.map((key) => [key, 0]));
    for (const invoice of trendInvoices) {
      const key = dateKey(invoice.invoiceDate);
      if (dailySales.has(key)) dailySales.set(key, (dailySales.get(key) ?? 0) + invoice.totalAmount);
    }

    return NextResponse.json({
      dateRange: { from: rangeFrom, to: rangeTo },
      todaySales: todayInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0),
      todayInvoiceCount: todayInvoices.length,
      weeklySales: weekInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0),
      monthlySales: monthInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0),
      monthlyInvoiceCount: monthInvoices.length,
      rangeSales: rangeInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0),
      rangeInvoiceCount: rangeInvoices.length,
      rangeCollections,
      totalOutstanding: outstanding,
      totalInvoiceCount: allReceivables.length,
      totalCustomers,
      repeatCustomerCount: [...customerMap.values()].filter((customer) => customer.invoiceCount > 1).length,
      lowStockCount: lowStock.filter((product) => product.currentStock <= product.minimumStockLevel).length,
      lowStockProducts: lowStock.filter((product) => product.currentStock <= product.minimumStockLevel).slice(0, 10).map((product) => ({ id: product.id, name: product.marathiName || product.name, currentStock: product.currentStock, minimumStockLevel: product.minimumStockLevel, category: product.category?.name ?? "General" })),
      pendingPayments: allReceivables.filter((invoice) => invoice.totalAmount > invoice.paidAmount).length,
      topSellingProducts: [...productMap.values()].sort((a, b) => b.value - a.value).slice(0, 5),
      topCustomers: [...customerMap.values()].sort((a, b) => b.purchaseValue - a.purchaseValue).slice(0, 5),
      monthlyRevenueChart: monthLabels.map((key) => ({ name: new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" }).format(new Date(`${key}-01T12:00:00Z`)), revenue: salesByMonth.get(key) ?? 0 })),
      monthlyCollectionsChart: monthLabels.map((key) => ({ name: new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" }).format(new Date(`${key}-01T12:00:00Z`)), collections: collectionsByMonth.get(key) ?? 0 })),
      dailySalesChart: dailyLabels.map((key) => ({ name: key.slice(5), sales: dailySales.get(key) ?? 0 })),
      recentActivity: recentInvoices.map((invoice) => ({ id: invoice.id, title: `Invoice ${invoice.invoiceNumber}`, customer: invoice.customerName || "Walk-in Customer", amount: invoice.totalAmount, date: invoice.invoiceDate, status: invoice.status })),
    });
  } catch (error) {
    console.error("GET /api/dashboard/stats failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
import { Prisma } from "@prisma/client";
