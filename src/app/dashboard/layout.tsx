import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DashboardProviders } from "@/components/providers/session-provider";
import { DashboardLayoutClient } from "@/components/dashboard/dashboard-layout-client";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <DashboardProviders session={session}>
      <DashboardLayoutClient>{children}</DashboardLayoutClient>
    </DashboardProviders>
  );
}
