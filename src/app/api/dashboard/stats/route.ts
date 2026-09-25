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

    const [
      todayInvoices,
      monthlyInvoices,
      totalCustomers,
      pendingPayments,
      topProducts,
      monthlyRevenue,
    ] = await Promise.all([
      prisma.invoice.aggregate({
        where: { invoiceDate: { gte: startOfDay }, status: { not: "DRAFT" } },
        _sum: { totalAmount: true },
        _count: true,
      }),
      prisma.invoice.aggregate({
        where: { invoiceDate: { gte: startOfMonth }, status: { not: "DRAFT" } },
        _sum: { totalAmount: true },
        _count: true,
      }),
      prisma.customer.count({ where: { isActive: true } }),
      prisma.invoice.count({
        where: {
          status: { in: ["SENT", "PARTIALLY_PAID", "OVERDUE"] },
        },
      }),
      prisma.invoiceItem.groupBy({
        by: ["productId"],
        _sum: { quantity: true, amount: true },
        orderBy: { _sum: { amount: "desc" } },
        take: 5,
      }),
      prisma.invoice.groupBy({
        by: ["invoiceDate"],
        where: {
          invoiceDate: {
            gte: new Date(now.getFullYear(), now.getMonth() - 5, 1),
          },
          status: { not: "DRAFT" },
        },
        _sum: { totalAmount: true },
      }),
    ]);

    const lowStock = await prisma.product.findMany({
      where: { isActive: true },
      include: { category: true },
    }).then((products) =>
      products.filter((p) => p.currentStock <= p.minimumStockLevel).slice(0, 10)
    );

    const productIds = topProducts.map((p) => p.productId);
    const productDetails = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, marathiName: true },
    });

    const topSelling = topProducts.map((tp) => {
      const product = productDetails.find((p) => p.id === tp.productId);
      return {
        name: product?.marathiName || product?.name || "Unknown",
        value: tp._sum.amount ?? 0,
        quantity: tp._sum.quantity ?? 0,
      };
    });

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const revenueByMonth: Record<string, number> = {};

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      revenueByMonth[key] = 0;
    }

    monthlyRevenue.forEach((row) => {
      const d = new Date(row.invoiceDate);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      if (key in revenueByMonth) {
        revenueByMonth[key] += row._sum.totalAmount ?? 0;
      }
    });

    const recentInvoices = await prisma.invoice.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { customer: { select: { name: true } } },
    });

    return NextResponse.json({
      todaySales: todayInvoices._sum.totalAmount ?? 0,
      todayInvoiceCount: todayInvoices._count,
      monthlySales: monthlyInvoices._sum.totalAmount ?? 0,
      monthlyInvoiceCount: monthlyInvoices._count,
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
        customer: inv.customer.name,
        amount: inv.totalAmount,
        date: inv.createdAt,
        status: inv.status,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
