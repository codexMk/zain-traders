import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import type { Session } from "next-auth";

export async function authenticate(request: NextRequest) {
  void request;
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  return session;
}

export async function requireAuth(
  request: NextRequest
): Promise<Session | NextResponse> {
  const session = await authenticate(request);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return session;
}

export async function requireRole(
  request: NextRequest,
  allowedRoles: string[]
): Promise<Session | NextResponse> {
  const session = await requireAuth(request);

  if (session instanceof NextResponse) {
    return session;
  }

  if (!allowedRoles.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return session;
}
