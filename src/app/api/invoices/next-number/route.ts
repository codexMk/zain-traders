import { requireAuth } from "@/lib/auth-helpers";
import { generateInvoiceNumber } from "@/lib/invoice-utils";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    const invoiceNumber = await generateInvoiceNumber();
    return NextResponse.json({ invoiceNumber });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
