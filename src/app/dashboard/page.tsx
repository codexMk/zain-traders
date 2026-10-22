"use client";

import { FormEvent, useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertCircle, CreditCard, DollarSign, FileText, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/invoice-utils";

interface DashboardStats {
  todaySales: number; todayInvoiceCount: number; weeklySales: number; monthlySales: number; monthlyInvoiceCount: number;
  rangeSales: number; rangeInvoiceCount: number; rangeCollections: number; totalOutstanding: number; totalInvoiceCount: number;
  totalCustomers: number; repeatCustomerCount: number; lowStockCount: number; pendingPayments: number;
  topSellingProducts: { name: string; quantity: number; value: number }[];
  topCustomers: { id: string; name: string; purchaseValue: number; invoiceCount: number }[];
  monthlyRevenueChart: { name: string; revenue: number }[];
  monthlyCollectionsChart: { name: string; collections: number }[];
  dailySalesChart: { name: string; sales: number }[];
  lowStockProducts: { id: string; name: string; currentStock: number; minimumStockLevel: number; category: string }[];
  recentActivity: { id: string; title: string; customer: string; amount: number; date: string; status: string }[];
}

const todayIndia = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
const monthStartIndia = () => `${todayIndia().slice(0, 7)}-01`;

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ComponentType<{ size?: number }>; color: string }) {
  return <div className="rounded-2xl border-l-4 bg-white p-5 shadow-sm" style={{ borderColor: color }}><div className="flex items-center justify-between gap-3"><div><p className="mb-1 text-sm text-brand-muted">{label}</p><p className="text-xl font-bold text-brand-charcoal">{value}</p></div><Icon size={23} /></div></div>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [from, setFrom] = useState(monthStartIndia());
  const [to, setTo] = useState(todayIndia());
  const [appliedRange, setAppliedRange] = useState({ from: monthStartIndia(), to: todayIndia() });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch(`/api/dashboard/stats?from=${appliedRange.from}&to=${appliedRange.to}`)
      .then(async (response) => { const result = await response.json(); if (!response.ok) throw new Error(result.error || "Could not load dashboard"); return result; })
      .then(setStats)
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Could not load dashboard"))
      .finally(() => setLoading(false));
  }, [appliedRange]);

  const applyRange = (event: FormEvent) => {
    event.preventDefault();
    if (from && to && from <= to) setAppliedRange({ from, to });
    else setError("Choose a valid date range");
  };

  if (loading && !stats) return <div className="flex h-96 items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-emerald/20 border-r-brand-emerald" /></div>;
  if (!stats) return <div className="rounded-xl bg-red-50 p-5 text-center text-red-700">{error || "Failed to load dashboard"}</div>;

  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-3xl font-bold text-brand-charcoal">Zain Traders Dashboard</h1><p className="mt-1 text-brand-muted">Sales, collections and inventory</p></div><Link href="/dashboard/billing/new" className="rounded-2xl bg-brand-gold px-6 py-3 text-lg font-bold text-brand-charcoal hover:opacity-90">+ New Bill</Link></div>
    <form onSubmit={applyRange} className="flex flex-wrap items-end gap-3 rounded-2xl border bg-white p-4 shadow-sm"><label className="text-sm text-brand-muted">From<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1 block rounded-lg border px-3 py-2 text-brand-charcoal" /></label><label className="text-sm text-brand-muted">To<input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="mt-1 block rounded-lg border px-3 py-2 text-brand-charcoal" /></label><button disabled={loading} className="rounded-lg bg-brand-emerald px-4 py-2 font-semibold text-white disabled:opacity-50">{loading ? "Updating…" : "Apply range"}</button><p className="text-xs text-brand-muted">Range sales and collections · daily, weekly and monthly cards use the current India business date</p></form>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Today's sales" value={formatCurrency(stats.todaySales)} icon={DollarSign} color="#0F3D2E" />
      <StatCard label="This week" value={formatCurrency(stats.weeklySales)} icon={TrendingUp} color="#D4AF37" />
      <StatCard label="This month" value={formatCurrency(stats.monthlySales)} icon={FileText} color="#2563eb" />
      <StatCard label="Outstanding receivables" value={formatCurrency(stats.totalOutstanding)} icon={CreditCard} color="#dc2626" />
      <StatCard label="Sales in selected range" value={formatCurrency(stats.rangeSales)} icon={DollarSign} color="#047857" />
      <StatCard label="Collections in selected range" value={formatCurrency(stats.rangeCollections)} icon={CreditCard} color="#7c3aed" />
      <StatCard label="Invoices in range" value={stats.rangeInvoiceCount} icon={FileText} color="#0891b2" />
      <StatCard label="Finalized invoices total" value={stats.totalInvoiceCount} icon={FileText} color="#4f46e5" />
      <StatCard label="Repeat customers in range" value={stats.repeatCustomerCount} icon={Users} color="#9333ea" />
    </div>
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="mb-4 font-semibold text-brand-emerald">Monthly sales and collections</h2><ResponsiveContainer width="100%" height={280}><LineChart data={stats.monthlyRevenueChart.map((month) => ({ ...month, collections: stats.monthlyCollectionsChart.find((entry) => entry.name === month.name)?.collections ?? 0 }))}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" fontSize={12} /><YAxis fontSize={11} /><Tooltip formatter={(value: number) => formatCurrency(value)} /><Line type="monotone" dataKey="revenue" name="Sales" stroke="#0F3D2E" strokeWidth={3} /><Line type="monotone" dataKey="collections" name="Collections" stroke="#D4AF37" strokeWidth={3} /></LineChart></ResponsiveContainer></div>
      <div className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="mb-4 font-semibold text-brand-emerald">Daily sales · last 7 days</h2><ResponsiveContainer width="100%" height={280}><BarChart data={stats.dailySalesChart}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" fontSize={12} /><YAxis fontSize={11} /><Tooltip formatter={(value: number) => formatCurrency(value)} /><Bar dataKey="sales" fill="#0F3D2E" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
      <div className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="mb-4 font-semibold text-brand-emerald">Best-selling products · selected range</h2>{stats.topSellingProducts.length ? <div className="space-y-3">{stats.topSellingProducts.map((product, index) => <div key={`${product.name}-${index}`} className="flex items-center justify-between gap-4 border-b pb-2 text-sm"><div><p className="font-medium">{product.name}</p><p className="text-xs text-brand-muted">{product.quantity} units sold</p></div><b>{formatCurrency(product.value)}</b></div>)}</div> : <p className="text-sm text-brand-muted">No sales in this date range</p>}</div>
      <div className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="mb-4 font-semibold text-brand-emerald">Top customers · selected range</h2>{stats.topCustomers.length ? <div className="space-y-3">{stats.topCustomers.map((customer) => <div key={customer.id} className="flex items-center justify-between gap-4 border-b pb-2 text-sm"><div><p className="font-medium">{customer.name}</p><p className="text-xs text-brand-muted">{customer.invoiceCount} invoices{customer.invoiceCount > 1 ? " · repeat" : ""}</p></div><b>{formatCurrency(customer.purchaseValue)}</b></div>)}</div> : <p className="text-sm text-brand-muted">No customer sales in this date range</p>}</div>
      {stats.lowStockProducts.length > 0 && <div className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="mb-4 flex items-center gap-2 font-semibold text-amber-700"><AlertCircle size={19} />Low stock products</h2><div className="space-y-2">{stats.lowStockProducts.map((product) => <div key={product.id} className="flex justify-between gap-4 rounded-lg bg-amber-50 p-3 text-sm"><span>{product.name}</span><b>{product.currentStock} / {product.minimumStockLevel} {product.category}</b></div>)}</div><Link href="/dashboard/inventory" className="mt-3 block text-sm font-medium text-brand-emerald">View inventory →</Link></div>}
      <div className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="mb-4 font-semibold text-brand-emerald">Recent invoices</h2>{stats.recentActivity.length ? <div className="space-y-3">{stats.recentActivity.map((activity) => <Link key={activity.id} href={`/dashboard/billing/${activity.id}`} className="flex items-center justify-between gap-4 rounded-xl bg-brand-cream/50 p-3 hover:bg-brand-cream"><div><p className="font-medium">{activity.title}</p><p className="text-xs text-brand-muted">{activity.customer} · {activity.status}</p></div><b className="text-sm">{formatCurrency(activity.amount)}</b></Link>)}</div> : <p className="text-sm text-brand-muted">No invoices yet</p>}</div>
    </div>
  </div>;
}
