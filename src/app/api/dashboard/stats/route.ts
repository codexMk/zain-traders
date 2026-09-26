import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const revenueStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [
      todayInvoices,
      monthlyInvoices,
      totalCustomers,
      pendingPayments,
      allInvoiceItems,
      monthlyRevenueRows,
      lowStock,
      recentInvoices,
    ] = await Promise.all([
      prisma.invoice.findMany({
        where: { invoiceDate: { gte: startOfDay }, status: { not: "DRAFT" } },
        select: { totalAmount: true },
      }),
      prisma.invoice.findMany({
        where: { invoiceDate: { gte: startOfMonth }, status: { not: "DRAFT" } },
        select: { totalAmount: true },
      }),
      prisma.customer.count({ where: { isActive: true } }),
      prisma.invoice.count({
        where: {
          status: { in: ["SENT", "PARTIALLY_PAID", "OVERDUE"] },
        },
      }),
      prisma.invoiceItem.findMany({
        select: { productId: true, quantity: true, amount: true },
      }),
      prisma.invoice.findMany({
        where: {
          invoiceDate: { gte: revenueStart },
          status: { not: "DRAFT" },
        },
        select: { invoiceDate: true, totalAmount: true },
      }),
      prisma.product
        .findMany({
          where: { isActive: true },
          include: { category: true },
        })
        .then((products) =>
          products.filter((p) => p.currentStock <= p.minimumStockLevel).slice(0, 10)
        ),
      prisma.invoice.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { customer: { select: { name: true } } },
      }),
    ]);

    const todaySales = todayInvoices.reduce(
      (sum, invoice) => sum + Number(invoice.totalAmount ?? 0),
      0
    );
    const monthlySales = monthlyInvoices.reduce(
      (sum, invoice) => sum + Number(invoice.totalAmount ?? 0),
      0
    );

    const productTotals = new Map<
      string,
      { productId: string; quantity: number; value: number }
    >();

    allInvoiceItems.forEach((item) => {
      const previous = productTotals.get(item.productId) ?? {
        productId: item.productId,
        quantity: 0,
        value: 0,
      };

      productTotals.set(item.productId, {
        productId: item.productId,
        quantity: previous.quantity + Number(item.quantity ?? 0),
        value: previous.value + Number(item.amount ?? 0),
      });
    });

    const productIds = [...productTotals.keys()];
    const productDetails = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, marathiName: true },
    });

    const topSelling = [...productTotals.values()]
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .map((entry) => {
        const product = productDetails.find((item) => item.id === entry.productId);
        return {
          name: product?.marathiName || product?.name || "Unknown",
          value: entry.value,
          quantity: entry.quantity,
        };
      });

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const revenueByMonth: Record<string, number> = {};

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      revenueByMonth[key] = 0;
    }

    monthlyRevenueRows.forEach((row) => {
      const d = new Date(row.invoiceDate);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      if (key in revenueByMonth) {
        revenueByMonth[key] += Number(row.totalAmount ?? 0);
      }
    });

    return NextResponse.json({
      todaySales,
      todayInvoiceCount: todayInvoices.length,
      monthlySales,
      monthlyInvoiceCount: monthlyInvoices.length,
      totalCustomers,
      lowStockCount: lowStock.length,
      lowStockProducts: lowStock.map((p) => ({
        id: p.id,
        name: p.marathiName || p.name,
        currentStock: p.currentStock,
        minimumStockLevel: p.minimumStockLevel,
        category: p.category?.name ?? "General",
      })),
      pendingPayments,
      topSellingProducts: topSelling,
      monthlyRevenueChart: Object.entries(revenueByMonth).map(([name, revenue]) => ({
        name,
        revenue,
      })),
      recentActivity: recentInvoices.map((inv) => ({
        id: inv.id,
        title: `Invoice ${inv.invoiceNumber}`,
        customer: inv.customer?.name ?? "Unknown customer",
        amount: Number(inv.totalAmount ?? 0),
        date: inv.createdAt,
        status: inv.status,
      })),
    });
  } catch (error) {
    console.error("GET /api/dashboard/stats failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
