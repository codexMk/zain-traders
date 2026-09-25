"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  Users,
  AlertCircle,
  DollarSign,
  CreditCard,
} from "lucide-react";
import { formatCurrency } from "@/lib/invoice-utils";
import Link from "next/link";

interface DashboardStats {
  todaySales: number;
  monthlySales: number;
  totalCustomers: number;
  lowStockCount: number;
  pendingPayments: number;
  topSellingProducts: { name: string; value: number }[];
  monthlyRevenueChart: { name: string; revenue: number }[];
  lowStockProducts: { id: string; name: string; currentStock: number; minimumStockLevel: number }[];
  recentActivity: { id: string; title: string; customer: string; amount: number; date: string; status: string }[];
}

const StatCard = ({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  color: string;
}) => (
  <div className="bg-white rounded-2xl shadow-sm p-6 border-l-4" style={{ borderColor: color }}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-brand-muted text-sm mb-1">{label}</p>
        <p className="text-2xl font-bold text-brand-charcoal">{value}</p>
      </div>
      <div className="p-3 rounded-xl" style={{ backgroundColor: `${color}15`, color }}>
        <Icon className="w-6 h-6" size={24} />
      </div>
    </div>
  </div>
);

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-emerald/20 border-r-brand-emerald" />
      </div>
    );
  }

  if (!stats) {
    return <div className="text-center text-brand-muted">Failed to load dashboard</div>;
  }

  const lowStockProducts = stats.lowStockProducts ?? [];
  const recentActivity = stats.recentActivity ?? [];
  const monthlyRevenueChart = stats.monthlyRevenueChart ?? [];
  const topSellingProducts = stats.topSellingProducts ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-charcoal">Dashboard</h1>
          <p className="text-brand-muted mt-1">ज़ैन ट्रेडर्स — Billing & Inventory</p>
        </div>
        <Link
          href="/dashboard/billing/new"
          className="px-6 py-3 bg-brand-gold text-brand-charcoal font-bold rounded-2xl hover:opacity-90 transition text-lg"
        >
          + New Invoice
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard label="Today's Sales" value={formatCurrency(stats.todaySales)} icon={DollarSign} color="#0F3D2E" />
        <StatCard label="Monthly Sales" value={formatCurrency(stats.monthlySales)} icon={TrendingUp} color="#D4AF37" />
        <StatCard label="Total Customers" value={stats.totalCustomers} icon={Users} color="#9333ea" />
        <StatCard label="Low Stock Alerts" value={stats.lowStockCount} icon={AlertCircle} color="#d97706" />
        <StatCard label="Pending Payments" value={stats.pendingPayments} icon={CreditCard} color="#dc2626" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-brand-emerald mb-4">Monthly Revenue</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyRevenueChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Bar dataKey="revenue" fill="#0F3D2E" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-brand-emerald mb-4">Top Selling Products</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={topSellingProducts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={11} />
              <YAxis fontSize={12} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Line type="monotone" dataKey="value" stroke="#D4AF37" strokeWidth={3} dot={{ fill: "#0F3D2E" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {lowStockProducts.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-amber-600 mb-4 flex items-center gap-2">
              <AlertCircle size={20} /> Low Stock Products
            </h3>
            <div className="space-y-2">
              {lowStockProducts.map((p) => (
                <div key={p.id} className="flex justify-between p-3 bg-amber-50 rounded-xl">
                  <span className="font-medium">{p.name}</span>
                  <span className="text-amber-700 font-semibold">
                    {p.currentStock} / {p.minimumStockLevel} min
                  </span>
                </div>
              ))}
            </div>
            <Link href="/dashboard/inventory" className="block mt-4 text-brand-emerald text-sm font-medium hover:underline">
              View Inventory →
            </Link>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-brand-emerald mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivity.length === 0 ? (
              <p className="text-brand-muted text-sm">No recent invoices</p>
            ) : (
              recentActivity.map((act) => (
                <Link
                  key={act.id}
                  href={`/dashboard/billing/${act.id}`}
                  className="flex items-center justify-between p-3 bg-brand-cream/50 rounded-xl hover:bg-brand-cream transition"
                >
                  <div>
                    <p className="font-medium">{act.title}</p>
                    <p className="text-xs text-brand-muted">{act.customer} • {act.status}</p>
                  </div>
                  <span className="text-brand-emerald font-semibold">{formatCurrency(act.amount)}</span>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
