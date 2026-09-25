import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    const customers = await prisma.customer.findMany({
      where: { isActive: true },
      include: {
        invoices: {
          where: { status: { in: ["SENT", "PARTIALLY_PAID", "OVERDUE"] } },
          select: {
            id: true,
            invoiceNumber: true,
            totalAmount: true,
            paidAmount: true,
            status: true,
            invoiceDate: true,
          },
        },
        ledgerEntries: {
          orderBy: { entryDate: "desc" },
          take: 5,
        },
      },
      orderBy: { outstandingAmount: "desc" },
    });

    const report = customers
      .filter((c) => c.outstandingAmount > 0 || c.invoices.length > 0)
      .map((c) => ({
        id: c.id,
        name: c.name,
        mobile: c.mobile,
        address: c.address,
        creditLimit: c.creditLimit,
        outstandingAmount: c.outstandingAmount,
        pendingInvoices: c.invoices.map((inv) => ({
          invoiceNumber: inv.invoiceNumber,
          totalAmount: inv.totalAmount,
          paidAmount: inv.paidAmount,
          pending: inv.totalAmount - inv.paidAmount,
          status: inv.status,
          invoiceDate: inv.invoiceDate,
        })),
        recentLedger: c.ledgerEntries,
      }));

    const totalOutstanding = report.reduce((sum, c) => sum + c.outstandingAmount, 0);

    return NextResponse.json({ totalOutstanding, customers: report });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
