import { requireAuth, requireRole } from "@/lib/auth-helpers";
import { businessInfo } from "@/lib/business-info";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const settingsSchema = z.object({
  legalName: z.string().trim().min(1).max(200),
  address: z.string().trim().min(1).max(500),
  phoneNumbers: z.array(z.string().trim().min(1).max(30)).min(1).max(5),
  gstin: z.string().trim().max(20).optional().nullable(),
  registeredStateCode: z.string().regex(/^\d{2}$/).optional().nullable(),
});

export async function GET(request: NextRequest) {
  const session = await requireAuth(request);
  if (session instanceof NextResponse) return session;
  const settings = await prisma.businessSettings.findUnique({ where: { id: "default" } });
  return NextResponse.json(settings ?? {
    id: "default",
    legalName: businessInfo.nameEnglish,
    address: businessInfo.address,
    phoneNumbers: businessInfo.phones,
    gstin: null,
    registeredStateCode: null,
  });
}

export async function PUT(request: NextRequest) {
  const session = await requireRole(request, ["OWNER"]);
  if (session instanceof NextResponse) return session;
  try {
    const data = settingsSchema.parse(await request.json());
    const gstin = data.gstin?.trim().toUpperCase() || null;
    if ((gstin && !data.registeredStateCode) || (!gstin && data.registeredStateCode)) {
      return NextResponse.json({ error: "Enter both the GSTIN and registered state, or leave both blank" }, { status: 400 });
    }
    if (gstin && !/^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/.test(gstin)) {
      return NextResponse.json({ error: "Enter a valid GSTIN" }, { status: 400 });
    }
    if (gstin && gstin.slice(0, 2) !== data.registeredStateCode) {
      return NextResponse.json({ error: "GSTIN state code must match the registered state" }, { status: 400 });
    }
    const settings = await prisma.businessSettings.upsert({
      where: { id: "default" },
      create: { id: "default", ...data, gstin },
      update: { ...data, gstin },
    });
    return NextResponse.json(settings);
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid settings" }, { status: 400 });
    console.error("PUT /api/settings/business failed", error);
    return NextResponse.json({ error: "Failed to save business settings" }, { status: 500 });
  }
}
