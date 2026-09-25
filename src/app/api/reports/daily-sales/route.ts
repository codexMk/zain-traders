import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    const targetDate = dateParam ? new Date(dateParam) : new Date();

    const startOfDay = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      targetDate.getDate()
    );
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const invoices = await prisma.invoice.findMany({
      where: {
        invoiceDate: { gte: startOfDay, lt: endOfDay },
        status: { not: "DRAFT" },
      },
      include: {
        customer: { select: { name: true } },
        items: { include: { product: true } },
      },
      orderBy: { invoiceDate: "asc" },
    });

    const totalSales = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const totalGst = invoices.reduce((sum, inv) => sum + inv.gstAmount, 0);
    const cashSales = invoices
      .filter((i) => i.paymentType === "CASH")
      .reduce((sum, inv) => sum + inv.totalAmount, 0);
    const upiSales = invoices
      .filter((i) => i.paymentType === "UPI")
      .reduce((sum, inv) => sum + inv.totalAmount, 0);
    const creditSales = invoices
      .filter((i) => i.paymentType === "CREDIT")
      .reduce((sum, inv) => sum + inv.totalAmount, 0);

    return NextResponse.json({
      date: startOfDay.toISOString(),
      summary: {
        invoiceCount: invoices.length,
        totalSales,
        totalGst,
        cashSales,
        upiSales,
        creditSales,
      },
      invoices: invoices.map((inv) => ({
        invoiceNumber: inv.invoiceNumber,
        customer: inv.customer.name,
        paymentType: inv.paymentType,
        totalAmount: inv.totalAmount,
        gstAmount: inv.gstAmount,
        itemCount: inv.items.length,
        status: inv.status,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
