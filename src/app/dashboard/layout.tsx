"use client";

import { useState } from "react";
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
  Warehouse,
} from "lucide-react";
import { DashboardProviders } from "@/components/providers/session-provider";

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const menuItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Billing", href: "/dashboard/billing", icon: FileText },
    { label: "Products", href: "/dashboard/products", icon: Package },
    { label: "Customers", href: "/dashboard/customers", icon: Users },
    { label: "Inventory", href: "/dashboard/inventory", icon: Warehouse },
    { label: "Suppliers", href: "/dashboard/suppliers", icon: Briefcase },
    { label: "Purchase", href: "/dashboard/purchases", icon: ShoppingCart },
    { label: "Reports", href: "/dashboard/reports", icon: BarChart3 },
    { label: "Rate History", href: "/dashboard/rate-history", icon: TrendingUp },
  ];

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  return (
    <div className="flex h-screen bg-brand-cream">
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-brand-emerald text-white transform transition-transform duration-300 lg:static lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 border-b border-white/10">
          <h1 className="text-xl font-bold text-brand-gold">ज़ैन ट्रेडर्स</h1>
          <p className="text-xs text-white/70">Billing & Inventory</p>
          {session?.user && (
            <p className="text-xs mt-2 text-brand-gold/80">
              {session.user.name} ({session.user.role})
            </p>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center px-4 py-3 rounded-xl transition ${
                  active ? "bg-brand-gold text-brand-charcoal font-semibold" : "text-white/90 hover:bg-white/10"
                }`}
              >
                <Icon size={20} className="mr-3" />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-2">
          <Link
            href="/dashboard/settings"
            className={`flex items-center px-4 py-3 rounded-xl transition ${
              isActive("/dashboard/settings") ? "bg-brand-gold text-brand-charcoal" : "text-white/90 hover:bg-white/10"
            }`}
          >
            <Settings size={20} className="mr-3" />
            <span className="text-sm">Settings</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 rounded-xl text-white/90 hover:bg-white/10 transition"
          >
            <LogOut size={20} className="mr-3" />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 lg:hidden z-30" onClick={() => setMobileOpen(false)} />
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="min-h-[64px] bg-white border-b px-4 py-3 shadow-sm md:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden text-brand-charcoal">
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <div className="flex flex-1 flex-wrap items-center gap-x-3 gap-y-1 text-[11px] leading-relaxed text-brand-muted md:text-xs">
              <span>Head Office: Mallik Nagar, Kondhwa, Pune 411048</span>
              <span className="hidden sm:inline">•</span>
              <span>Branch Office: Bus Stand, Paranda, Dharashiv 413502</span>
              <span className="hidden sm:inline">•</span>
              <span>9307427731 | 9021276946</span>
            </div>

            <Link
              href="/dashboard/billing/new"
              className="inline-flex items-center justify-center rounded-xl bg-brand-gold px-4 py-2 text-sm font-bold text-brand-charcoal transition hover:opacity-90"
            >
              + Invoice
            </Link>
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          <div className="p-4 md:p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProviders>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </DashboardProviders>
  );
}
