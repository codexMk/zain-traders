"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";

export function DashboardProviders({
  children,
  session,
}: {
  children: React.ReactNode;
  session?: Session | null;
}) {
  return <SessionProvider session={session ?? undefined}>{children}</SessionProvider>;
}
