"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  Package,
  Users,
  Briefcase,
  AlertCircle,
  ShoppingCart,
  DollarSign,
} from "lucide-react";

interface DashboardStats {
  todaySales: number;
  monthlySales: number;
  totalCustomers: number;
  totalSuppliers: number;
  totalProducts: number;
  pendingPayments: number;
  lowStockCount: number;
  salesData: { name: string; sales: number; revenue: number }[];
  productSalesData: { name: string; value: number }[];
  recentActivity: { id: string; title: string; date: string; amount: number }[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasFields(
  value: unknown,
  stringFields: string[],
  numberFields: string[],
): boolean {
  if (!isRecord(value)) return false;
  return (
    stringFields.every((field) => typeof value[field] === "string") &&
    numberFields.every((field) => typeof value[field] === "number")
  );
}

function isDashboardStats(value: unknown): value is DashboardStats {
  if (!isRecord(value)) return false;
  const numberFields = [
    "todaySales",
    "monthlySales",
    "totalCustomers",
    "totalSuppliers",
    "totalProducts",
    "pendingPayments",
    "lowStockCount",
  ];
  const isArrayOf = (field: string, predicate: (item: unknown) => boolean) =>
    Array.isArray(value[field]) && value[field].every(predicate);

  return (
    numberFields.every((field) => typeof value[field] === "number") &&
    isArrayOf("salesData", (item) =>
      hasFields(item, ["name"], ["sales", "revenue"]),
    ) &&
    isArrayOf("productSalesData", (item) =>
      hasFields(item, ["name"], ["value"]),
    ) &&
    isArrayOf("recentActivity", (item) =>
      hasFields(item, ["id", "title", "date"], ["amount"]),
    )
  );
}

const StatCard = ({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) => (
  <div className="bg-white rounded-lg shadow p-6 border-l-4" style={{ borderColor: color }}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-600 text-sm mb-1">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
      <div className={`p-3 rounded-lg`} style={{ backgroundColor: `${color}20` }}>
        {Icon}
      </div>
    </div>
  </div>
);

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const COLORS = ["#059669", "#10b981", "#34d399", "#6ee7b7", "#d1fae5"];

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      setError("");
      try {
        const response = await fetch("/api/dashboard/stats");
        const result: unknown = await response.json();
        if (!response.ok) {
          const message =
            isRecord(result) && typeof result.error === "string"
              ? result.error
              : "Could not load dashboard";
          throw new Error(message);
        }
        if (!isDashboardStats(result)) {
          throw new Error("The server returned an unexpected dashboard response");
        }
        setStats(result);
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Could not load dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-emerald-200 border-r-emerald-600"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center text-red-700" role="alert">
        {error || "Failed to load dashboard data"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome to your ERP system</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Today's Sales"
          value={`₹${stats.todaySales.toLocaleString()}`}
          icon={<DollarSign className="w-6 h-6 text-emerald-600" />}
          color="#059669"
        />
        <StatCard
          label="Monthly Sales"
          value={`₹${stats.monthlySales.toLocaleString()}`}
          icon={<TrendingUp className="w-6 h-6 text-blue-600" />}
          color="#2563eb"
        />
        <StatCard
          label="Total Customers"
          value={stats.totalCustomers}
          icon={<Users className="w-6 h-6 text-purple-600" />}
          color="#9333ea"
        />
        <StatCard
          label="Total Suppliers"
          value={stats.totalSuppliers}
          icon={<Briefcase className="w-6 h-6 text-orange-600" />}
          color="#ea580c"
        />
        <StatCard
          label="Total Products"
          value={stats.totalProducts}
          icon={<Package className="w-6 h-6 text-cyan-600" />}
          color="#0891b2"
        />
        <StatCard
          label="Pending Payments"
          value={stats.pendingPayments}
          icon={<ShoppingCart className="w-6 h-6 text-red-600" />}
          color="#dc2626"
        />
        <StatCard
          label="Low Stock Alerts"
          value={stats.lowStockCount}
          icon={<AlertCircle className="w-6 h-6 text-amber-600" />}
          color="#d97706"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Graph</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="sales" stroke="#059669" strokeWidth={2} />
              <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Product Sales Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Products</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats.productSalesData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {stats.productSalesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Revenue</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" fill="#059669" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {stats.recentActivity.length ? (
              stats.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium text-gray-900">{activity.title}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.date).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <span className="text-emerald-600 font-semibold">
                    ₹{activity.amount.toLocaleString("en-IN")}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-600">No recent invoices.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
