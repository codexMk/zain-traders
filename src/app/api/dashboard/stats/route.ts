import { requireAuth } from "@/lib/auth-helpers";
import { indiaDateKey, indiaStartOfDay } from "@/lib/date-utils";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const shiftDay = (key: string, amount: number) => {
  const date = new Date(`${key}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
};

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    const today = indiaDateKey();
    const todayStart = indiaStartOfDay(today);
    const tomorrowStart = indiaStartOfDay(shiftDay(today, 1));
    const weekStart = indiaStartOfDay(shiftDay(today, -6));
    const monthStart = indiaStartOfDay(`${today.slice(0, 7)}-01`);
    const finalizedInvoices = { status: { not: "DRAFT" as const } };

    const [
      todayInvoices,
      monthInvoices,
      weekInvoices,
      receivables,
      totalCustomers,
      totalSuppliers,
      totalProducts,
      stockLevels,
      productItems,
      recentInvoices,
    ] = await Promise.all([
      prisma.invoice.findMany({
        where: {
          ...finalizedInvoices,
          invoiceDate: { gte: todayStart, lt: tomorrowStart },
        },
        select: { totalAmount: true },
      }),
      prisma.invoice.findMany({
        where: {
          ...finalizedInvoices,
          invoiceDate: { gte: monthStart, lt: tomorrowStart },
        },
        select: { totalAmount: true },
      }),
      prisma.invoice.findMany({
        where: {
          ...finalizedInvoices,
          invoiceDate: { gte: weekStart, lt: tomorrowStart },
        },
        select: { invoiceDate: true, totalAmount: true },
      }),
      prisma.invoice.findMany({
        where: finalizedInvoices,
        select: { totalAmount: true, paidAmount: true },
      }),
      prisma.customer.count({ where: { isActive: true } }),
      prisma.supplier.count({ where: { isActive: true } }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.product.findMany({
        where: { isActive: true },
        select: { currentStock: true, minimumStockLevel: true },
      }),
      prisma.invoiceItem.findMany({
        where: {
          invoice: {
            ...finalizedInvoices,
            invoiceDate: { gte: monthStart, lt: tomorrowStart },
          },
        },
        select: {
          productId: true,
          amount: true,
          product: { select: { name: true } },
        },
      }),
      prisma.invoice.findMany({
        where: finalizedInvoices,
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { id: true, invoiceNumber: true, createdAt: true, totalAmount: true },
      }),
    ]);

    const salesByDay = new Map<string, number>();
    const dayLabels = Array.from({ length: 7 }, (_, index) => shiftDay(today, index - 6));
    for (const day of dayLabels) salesByDay.set(day, 0);
    for (const invoice of weekInvoices) {
      const key = indiaDateKey(invoice.invoiceDate);
      salesByDay.set(key, (salesByDay.get(key) ?? 0) + invoice.totalAmount);
    }

    const productSales = new Map<string, { name: string; value: number }>();
    for (const item of productItems) {
      const previous = productSales.get(item.productId) ?? {
        name: item.product.name,
        value: 0,
      };
      productSales.set(item.productId, {
        ...previous,
        value: previous.value + item.amount,
      });
    }

    return NextResponse.json({
      todaySales: todayInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0),
      monthlySales: monthInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0),
      totalCustomers,
      totalSuppliers,
      totalProducts,
      pendingPayments: receivables.filter(
        (invoice) => invoice.totalAmount > invoice.paidAmount,
      ).length,
      lowStockCount: stockLevels.filter(
        (product) => product.currentStock <= product.minimumStockLevel,
      ).length,
      salesData: dayLabels.map((day) => {
        const sales = salesByDay.get(day) ?? 0;
        return {
          name: new Intl.DateTimeFormat("en", {
            weekday: "short",
            timeZone: "UTC",
          }).format(new Date(`${day}T12:00:00Z`)),
          sales,
          revenue: sales,
        };
      }),
      productSalesData: [...productSales.values()]
        .sort((left, right) => right.value - left.value)
        .slice(0, 5),
      recentActivity: recentInvoices.map((invoice) => ({
        id: invoice.id,
        title: `Invoice #${invoice.invoiceNumber} Created`,
        date: invoice.createdAt,
        amount: invoice.totalAmount,
      })),
    });
  } catch (error) {
    console.error("GET /api/dashboard/stats failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
