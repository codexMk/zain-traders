"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
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
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  const menuItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Products",
      href: "/dashboard/products",
      icon: Package,
    },
    {
      label: "Suppliers",
      href: "/dashboard/suppliers",
      icon: Briefcase,
    },
    {
      label: "Customers",
      href: "/dashboard/customers",
      icon: Users,
    },
    {
      label: "Purchase",
      href: "/dashboard/purchases",
      icon: ShoppingCart,
    },
    {
      label: "Billing",
      href: "/dashboard/billing",
      icon: FileText,
    },
    {
      label: "Inventory",
      href: "/dashboard/inventory",
      icon: Package,
    },
    {
      label: "Accounting",
      href: "/dashboard/accounting",
      icon: BarChart3,
    },
    {
      label: "Rate History",
      href: "/dashboard/rate-history",
      icon: TrendingUp,
    },
    {
      label: "Reports",
      href: "/dashboard/reports",
      icon: BarChart3,
    },
  ];

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/");
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  return (
    <div className="flex h-dvh min-h-svh w-full overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 flex h-dvh w-64 max-w-[85vw] flex-col overflow-hidden bg-emerald-900 text-white transform transition-transform duration-300 ease-in-out lg:static lg:max-w-none lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="shrink-0 border-b border-emerald-800 p-6">
          <h1 className="text-xl font-bold">ज़ैन ट्रेडर्स</h1>
          <p className="text-xs text-emerald-200">ERP System</p>
        </div>

        {/* Navigation */}
        <nav aria-label="ERP navigation" className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain p-3 sm:p-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 items-center rounded-lg px-4 py-3 transition ${
                  active
                    ? "bg-emerald-700 text-white"
                    : "text-emerald-100 hover:bg-emerald-800"
                }`}
              >
                <Icon size={20} className="mr-3" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="shrink-0 space-y-2 border-t border-emerald-800 p-4">
          <Link
            href="/dashboard/settings"
            onClick={() => setMobileOpen(false)}
            aria-current={isActive("/dashboard/settings") ? "page" : undefined}
            className={`flex items-center px-4 py-3 rounded-lg transition ${
              isActive("/dashboard/settings")
                ? "bg-emerald-700 text-white"
                : "text-emerald-100 hover:bg-emerald-800"
            }`}
          >
            <Settings size={20} className="mr-3" />
            <span className="text-sm font-medium">Settings</span>
          </Link>

          <button
            onClick={handleLogout}
            type="button"
            className="w-full flex items-center px-4 py-3 rounded-lg text-emerald-100 hover:bg-emerald-800 transition"
          >
            <LogOut size={20} className="mr-3" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close ERP navigation"
          className="fixed inset-0 z-30 cursor-default bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex min-h-16 shrink-0 items-center justify-between gap-2 border-b border-gray-200 bg-white px-3 py-2 shadow-sm sm:px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-4">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              type="button"
              aria-label={mobileOpen ? "Close ERP navigation" : "Open ERP navigation"}
              aria-expanded={mobileOpen}
              className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 lg:hidden"
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h2 className="truncate text-sm font-semibold text-gray-800 sm:text-base lg:text-xl">
              ERP Dashboard
            </h2>
          </div>

          <div className="hidden shrink-0 text-xs text-gray-600 sm:block md:text-sm">
            Welcome to Zain Traders Management System
          </div>
        </header>

        {/* Content Area */}
        <main className="min-h-0 min-w-0 flex-1 overflow-auto overscroll-contain">
          <div className="min-w-0 p-3 sm:p-4 lg:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
