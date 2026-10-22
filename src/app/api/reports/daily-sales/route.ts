import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { indiaDateKey, indiaStartOfDay, isValidDateOnly } from "@/lib/date-utils";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    const today = indiaDateKey();
    const dateKey = dateParam || today;
    if (!isValidDateOnly(dateKey)) {
      return NextResponse.json({ error: "Use YYYY-MM-DD for the report date" }, { status: 400 });
    }
    const startOfDay = indiaStartOfDay(dateKey);
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const [invoices, payments] = await Promise.all([prisma.invoice.findMany({
      where: {
        invoiceDate: { gte: startOfDay, lt: endOfDay },
        status: { notIn: ["DRAFT", "CANCELLED"] },
      },
      select: {
        customerName: true,
        invoiceNumber: true,
        invoiceDate: true,
        totalAmount: true,
        paidAmount: true,
        gstAmount: true,
        paymentType: true,
        status: true,
        items: { select: { id: true } },
      },
      orderBy: { invoiceDate: "asc" },
    }), prisma.customerPayment.findMany({
      where: { paymentDate: { gte: startOfDay, lt: endOfDay }, reversedAt: null, invoice: { status: { notIn: ["DRAFT", "CANCELLED"] } } },
      select: { amount: true, paymentMethod: true },
    })]);

    const totalSales = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const totalGst = invoices.reduce((sum, inv) => sum + inv.gstAmount, 0);
    const cashCollections = payments.filter((payment) => payment.paymentMethod === "CASH").reduce((sum, payment) => sum + payment.amount, 0);
    const upiCollections = payments.filter((payment) => payment.paymentMethod === "UPI").reduce((sum, payment) => sum + payment.amount, 0);
    const outstandingReceivable = invoices.reduce((sum, invoice) => sum + Math.max(0, invoice.totalAmount - invoice.paidAmount), 0);

    return NextResponse.json({
      date: startOfDay.toISOString(),
      summary: {
        invoiceCount: invoices.length,
        totalSales,
        totalGst,
        cashCollections,
        upiCollections,
        outstandingReceivable,
      },
      invoices: invoices.map((inv) => ({
        invoiceNumber: inv.invoiceNumber,
        customer: inv.customerName || "Walk-in Customer",
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
