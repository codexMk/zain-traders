import { requireAuth, requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const expenseSchema = z.object({
  category: z.string().min(1),
  amount: z.number().positive(),
  description: z.string().min(1),
  expenseDate: z.string().transform((value) => new Date(value)).optional(),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    const expenses = await prisma.expense.findMany({
      orderBy: { expenseDate: "desc" },
      take: 20,
    });

    return NextResponse.json(expenses);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(request, ["OWNER", "ACCOUNTANT"]);
    if (session instanceof NextResponse) return session;

    const body = await request.json();
    const data = expenseSchema.parse(body);

    const expense = await prisma.$transaction(async (tx) => {
      const created = await tx.expense.create({
        data: {
          category: data.category,
          amount: data.amount,
          description: data.description,
          expenseDate: data.expenseDate ?? new Date(),
          notes: data.notes ?? null,
        },
      });

      await tx.ledger.create({
        data: {
          entryDate: data.expenseDate ?? new Date(),
          description: `${data.category}: ${data.description}`,
          debit: data.amount,
          credit: 0,
          balance: data.amount,
          ledgerType: "EXPENSE",
        },
      });

      return created;
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
