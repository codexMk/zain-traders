"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  Menu,
  X,
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  FileText,
  Briefcase,
  TrendingUp,
  BarChart3,
  LogOut,
  Settings,
  ReceiptText,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type MenuItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  section: string;
  roles?: string[];
};

const menuItems: MenuItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, section: "Overview" },
  { label: "Products", href: "/dashboard/products", icon: Package, section: "Workspace" },
  { label: "Suppliers", href: "/dashboard/suppliers", icon: Briefcase, section: "Workspace" },
  { label: "Customers", href: "/dashboard/customers", icon: Users, section: "Workspace" },
  { label: "Purchase", href: "/dashboard/purchases", icon: ShoppingCart, section: "Workspace" },
  { label: "Billing", href: "/dashboard/billing", icon: FileText, section: "Workspace" },
  { label: "Inventory", href: "/dashboard/inventory", icon: Package, section: "Workspace" },
  {
    label: "Expenses",
    href: "/dashboard/expenses",
    icon: ReceiptText,
    section: "Finance",
    roles: ["OWNER", "ACCOUNTANT"],
  },
  { label: "Accounting", href: "/dashboard/accounting", icon: BarChart3, section: "Finance" },
  { label: "Rate History", href: "/dashboard/rate-history", icon: TrendingUp, section: "Insights" },
  { label: "Reports", href: "/dashboard/reports", icon: BarChart3, section: "Insights" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  const visibleMenuItems = menuItems.filter(
    (item) => !item.roles || item.roles.includes(session?.user?.role ?? ""),
  );
  const sections = [...new Set(visibleMenuItems.map((item) => item.section))];
  const pageTitle = pathname === "/dashboard/settings"
    ? "Settings"
    : visibleMenuItems.find((item) => isActive(item.href))?.label ?? "Dashboard";
  const roleLabel = session?.user?.role === "OWNER"
    ? "Owner"
    : session?.user?.role === "ACCOUNTANT"
      ? "Accountant"
      : session?.user?.role === "STAFF"
        ? "Staff"
        : "ERP Workspace";

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  return (
    <div className="flex h-dvh min-h-svh w-full overflow-hidden bg-[#f5f7f5]">
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-dvh w-[min(18rem,85vw)] flex-col overflow-hidden border-r border-emerald-950/10 bg-[linear-gradient(180deg,#103f30_0%,#0b3326_100%)] text-white shadow-2xl shadow-emerald-950/15 transition-transform duration-300 ease-out lg:static lg:w-72 lg:translate-x-0 lg:shadow-none ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="shrink-0 border-b border-white/10 px-5 py-5 sm:px-6">
          <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="group flex items-center gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-amber-300">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-amber-300 text-sm font-black tracking-tight text-emerald-950 shadow-lg shadow-black/10 transition-transform group-hover:rotate-[-4deg]">
              ZT
            </span>
            <span className="min-w-0">
              <span className="block truncate text-base font-bold tracking-[0.12em]">ZAIN TRADERS</span>
              <span className="mt-0.5 block text-[11px] font-medium uppercase tracking-[0.18em] text-emerald-200/75">Management workspace</span>
            </span>
          </Link>
        </div>

        <nav aria-label="ERP navigation" className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-3 py-5 sm:px-4">
          {sections.map((section) => (
            <div key={section}>
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-200/55">{section}</p>
              <div className="space-y-1">
                {visibleMenuItems.filter((item) => item.section === section).map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={`group relative flex min-h-11 items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${
                        active
                          ? "bg-white text-emerald-950 shadow-md shadow-emerald-950/15"
                          : "text-emerald-50/80 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {active && <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-amber-400" />}
                      <Icon size={18} strokeWidth={active ? 2.4 : 1.9} className={active ? "ml-1 text-emerald-800" : "ml-1 text-emerald-200/80 transition-colors group-hover:text-amber-200"} />
                      <span className="flex-1">{item.label}</span>
                      {active && <span className="size-1.5 rounded-full bg-amber-500" aria-hidden="true" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="shrink-0 space-y-2 border-t border-white/10 p-3 sm:p-4">
          <div className="flex items-center gap-3 rounded-xl bg-black/10 px-3 py-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-amber-200/30 bg-emerald-700 text-xs font-bold text-amber-100">
              {(session?.user?.name?.trim().charAt(0) || "Z").toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-white">{session?.user?.name || "Zain Traders"}</span>
              <span className="block text-xs text-emerald-200/70">{roleLabel}</span>
            </span>
          </div>
          <Link
            href="/dashboard/settings"
            onClick={() => setMobileOpen(false)}
            aria-current={isActive("/dashboard/settings") ? "page" : undefined}
            className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${
              isActive("/dashboard/settings") ? "bg-white/15 text-white" : "text-emerald-50/80 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Settings size={18} />
            <span>Settings</span>
          </Link>
          <button
            onClick={handleLogout}
            type="button"
            className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-emerald-50/80 transition hover:bg-red-400/10 hover:text-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          >
            <LogOut size={18} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close ERP navigation"
          className="fixed inset-0 z-30 cursor-default bg-slate-950/55 backdrop-blur-[2px] lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="z-10 flex min-h-16 shrink-0 items-center justify-between gap-3 border-b border-gray-200/80 bg-white/95 px-3 py-2 shadow-sm shadow-gray-900/[0.03] sm:px-5 lg:px-7">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-4">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              type="button"
              aria-label={mobileOpen ? "Close ERP navigation" : "Open ERP navigation"}
              aria-expanded={mobileOpen}
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-gray-600 transition hover:bg-emerald-50 hover:text-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 lg:hidden"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <div className="min-w-0">
              <p className="truncate text-base font-bold text-gray-900 sm:text-lg">{pageTitle}</p>
              <p className="hidden truncate text-xs text-gray-500 sm:block">Zain Traders <span className="px-1 text-emerald-700">·</span> Operations workspace</p>
            </div>
          </div>
          <div className="hidden shrink-0 items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50/70 px-3 py-1.5 text-xs font-semibold text-emerald-900 md:flex">
            <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.12)]" />
            {roleLabel}
          </div>
        </header>

        <main className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain">
          <div className="min-h-full min-w-0 p-3 sm:p-5 lg:p-7">{children}</div>
        </main>
      </div>
    </div>
  );
}
