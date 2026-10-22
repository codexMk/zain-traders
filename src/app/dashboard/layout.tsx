"use client";

import { useState } from "react";
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
  ChevronDown,
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Products",
      href: "/products",
      icon: Package,
    },
    {
      label: "Suppliers",
      href: "/suppliers",
      icon: Briefcase,
    },
    {
      label: "Customers",
      href: "/customers",
      icon: Users,
    },
    {
      label: "Purchase",
      href: "/purchases",
      icon: ShoppingCart,
    },
    {
      label: "Billing",
      href: "/billing",
      icon: FileText,
    },
    {
      label: "Inventory",
      href: "/inventory",
      icon: Package,
    },
    {
      label: "Accounting",
      href: "/accounting",
      icon: BarChart3,
    },
    {
      label: "Rate History",
      href: "/rate-history",
      icon: TrendingUp,
    },
    {
      label: "Reports",
      href: "/reports",
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
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-emerald-900 text-white transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-emerald-800">
          <h1 className="text-xl font-bold">ज़ैन ट्रेडर्स</h1>
          <p className="text-xs text-emerald-200">ERP System</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 py-3 rounded-lg transition ${
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
        <div className="p-4 border-t border-emerald-800 space-y-2">
          <Link
            href="/settings"
            className={`flex items-center px-4 py-3 rounded-lg transition ${
              isActive("/settings")
                ? "bg-emerald-700 text-white"
                : "text-emerald-100 hover:bg-emerald-800"
            }`}
          >
            <Settings size={20} className="mr-3" />
            <span className="text-sm font-medium">Settings</span>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 rounded-lg text-emerald-100 hover:bg-emerald-800 transition"
          >
            <LogOut size={20} className="mr-3" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden text-gray-600"
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h2 className="text-xl font-semibold text-gray-800 hidden lg:block">
              ERP Dashboard
            </h2>
          </div>

          <div className="text-sm text-gray-600">
            Welcome to Zain Traders Management System
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
