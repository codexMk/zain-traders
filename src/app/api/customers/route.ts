import { requireAuth, requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const createCustomerSchema = z.object({
  name: z.string().min(1),
  mobile: z.string().min(1),
  address: z.string().min(1),
  gstNumber: z.string().optional(),
  creditLimit: z.number().default(0),
});

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    const customers = await prisma.customer.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(customers);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(request, ["OWNER", "STAFF"]);
    if (session instanceof NextResponse) return session;

    const body = await request.json();
    const data = createCustomerSchema.parse(body);

    // Check if customer with same mobile already exists
    const existing = await prisma.customer.findUnique({
      where: { mobile: data.mobile },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Customer with this mobile already exists" },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.create({
      data,
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
