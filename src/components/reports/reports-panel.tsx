"use client";

import { useState } from "react";
import { Download, FileText, BarChart3, Users, Package, Landmark } from "lucide-react";
import { exportToExcelCompatibleCsv } from "@/lib/export/csv-export";
import { formatCurrency } from "@/lib/invoice-utils";
import { useSession } from "next-auth/react";
import { permissions } from "@/lib/permissions";

type ReportType = "daily" | "products" | "outstanding" | "inventory" | "accounting" | "gst";

export default function ReportsPanel() {
  const { data: session } = useSession();
  const canViewProfit = permissions.canViewProfitReports(session?.user?.role ?? "STAFF");

  const [activeReport, setActiveReport] = useState<ReportType>("daily");
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<unknown>(null);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [gstFrom, setGstFrom] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  });
  const [gstTo, setGstTo] = useState(new Date().toISOString().split("T")[0]);

  const reports = [
    { id: "daily" as const, label: "Daily Sales", icon: FileText },
    { id: "accounting" as const, label: "Accounting", icon: Landmark },
    { id: "gst" as const, label: "GST Report", icon: BarChart3 },
    { id: "products" as const, label: "Product Sales", icon: BarChart3 },
    { id: "outstanding" as const, label: "Customer Outstanding", icon: Users },
    { id: "inventory" as const, label: "Inventory Report", icon: Package },
  ];

  const fetchReport = async (type: ReportType) => {
    setLoading(true);
    setActiveReport(type);

    const urls: Record<ReportType, string> = {
      daily: `/api/reports/daily-sales?date=${date}`,
      accounting: "/api/reports/accounting",
      gst: `/api/reports/gst?from=${gstFrom}&to=${gstTo}`,
      products: "/api/reports/product-sales",
      outstanding: "/api/reports/customer-outstanding",
      inventory: "/api/reports/inventory",
    };

    try {
      const res = await fetch(urls[type]);
      const data = await res.json();
      setReportData(data);
    } catch {
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    if (!reportData) return;

    if (activeReport === "daily") {
      const data = reportData as {
        invoices: { invoiceNumber: string; customer: string; totalAmount: number; paymentType: string; status: string }[];
        summary: { totalSales: number; invoiceCount: number };
      };
      exportToExcelCompatibleCsv("daily-sales-report", ["Invoice", "Customer", "Amount", "Payment", "Status"], data.invoices.map((i) => [i.invoiceNumber, i.customer, i.totalAmount, i.paymentType, i.status]));
    } else if (activeReport === "accounting") {
      const data = reportData as {
        summary: { totalSales: number; totalExpenses: number; totalReceivables: number; totalPayables: number; netProfit: number };
        expenseBreakdown: { category: string; amount: number }[];
      };
      const rows = [
        ["Metric", "Value"],
        ["Sales", data.summary.totalSales],
        ["Expenses", data.summary.totalExpenses],
        ["Net Profit", data.summary.netProfit],
        ["Receivables", data.summary.totalReceivables],
        ["Payables", data.summary.totalPayables],
      ];
      exportToExcelCompatibleCsv("accounting-report", ["Metric", "Value"], rows.slice(1));
    } else if (activeReport === "gst") {
      const data = reportData as GSTReportData & { period?: { from: string; to: string } };
      const periodLabel = data.period
        ? `${new Date(data.period.from).toLocaleDateString("en-IN")} to ${new Date(data.period.to).toLocaleDateString("en-IN")}`
        : `${gstFrom} to ${gstTo}`;
      const summaryRows = [
        ["Report", "GST Summary"],
        ["Period", periodLabel],
        ["Output GST (Sales)", data.summary.gstCollected],
        ["Input Tax (Purchases)", data.summary.inputTax],
        ["Net Tax Liability", data.summary.netTaxLiability],
        [],
      ];
      const detailRows = [
        ...data.invoiceBreakdown.map((entry) => [
          "SALE",
          entry.invoiceNumber,
          entry.customer,
          entry.taxableAmount,
          entry.gstAmount,
          entry.totalAmount,
        ]),
        ...data.purchaseBreakdown.map((entry) => [
          "PURCHASE",
          entry.invoiceNumber,
          entry.supplier,
          entry.taxableAmount,
          entry.gstAmount,
          entry.totalAmount,
        ]),
      ];
      exportToExcelCompatibleCsv(
        `gst-report-${gstFrom}-to-${gstTo}`,
        ["Side", "Document", "Party", "Taxable", "GST", "Total"],
        detailRows,
        summaryRows,
      );
    } else if (activeReport === "products") {
      const data = reportData as {
        products: { marathiName: string | null; name: string; category: string; totalQuantity: number; totalAmount: number }[];
      };
      exportToExcelCompatibleCsv("product-sales-report", ["Product", "Category", "Qty Sold", "Revenue"], data.products.map((p) => [p.marathiName || p.name, p.category, p.totalQuantity, p.totalAmount]));
    } else if (activeReport === "outstanding") {
      const data = reportData as {
        customers: { name: string; mobile: string; outstandingAmount: number; creditLimit: number }[];
      };
      exportToExcelCompatibleCsv("customer-outstanding-report", ["Customer", "Mobile", "Outstanding", "Credit Limit"], data.customers.map((c) => [c.name, c.mobile, c.outstandingAmount, c.creditLimit]));
    } else if (activeReport === "inventory") {
      const data = reportData as {
        products: { marathiName: string | null; name: string; category: string; currentStock: number; stockValue: number; isLowStock: boolean }[];
      };
      exportToExcelCompatibleCsv("inventory-report", ["Product", "Category", "Stock", "Value", "Low Stock"], data.products.map((p) => [p.marathiName || p.name, p.category, p.currentStock, p.stockValue, p.isLowStock ? "Yes" : "No"]));
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {reports.map((r) => {
          const Icon = r.icon;
          return (
            <button
              key={r.id}
              onClick={() => fetchReport(r.id)}
              className={`p-4 rounded-2xl border-2 text-left transition ${
                activeReport === r.id
                  ? "border-brand-emerald bg-brand-emerald text-white"
                  : "border-gray-200 bg-white hover:border-brand-gold"
              }`}
            >
              <Icon size={24} className="mb-2" />
              <p className="font-semibold text-sm">{r.label}</p>
            </button>
          );
        })}
      </div>

      {activeReport === "daily" && (
        <label className="flex items-center gap-2 text-sm text-brand-muted">
          Report date
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl border px-4 py-2 text-brand-charcoal"
          />
        </label>
      )}

      {activeReport === "gst" && (
        <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-brand-emerald/10 bg-white p-4">
          <label className="text-sm text-brand-muted">
            From
            <input
              type="date"
              value={gstFrom}
              onChange={(e) => setGstFrom(e.target.value)}
              className="mt-1 block rounded-xl border px-4 py-2 text-brand-charcoal"
            />
          </label>
          <label className="text-sm text-brand-muted">
            To
            <input
              type="date"
              value={gstTo}
              onChange={(e) => setGstTo(e.target.value)}
              className="mt-1 block rounded-xl border px-4 py-2 text-brand-charcoal"
            />
          </label>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => fetchReport(activeReport)}
          disabled={loading}
          className="px-6 py-3 bg-brand-emerald text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Loading..." : "Generate Report"}
        </button>
        {reportData != null && (
          <button
            onClick={exportReport}
            className="flex items-center gap-2 px-6 py-3 bg-brand-gold text-brand-charcoal font-semibold rounded-xl hover:opacity-90"
          >
            <Download size={18} /> Export CSV/Excel
          </button>
        )}
      </div>

      {reportData != null && (
        <div className="bg-white rounded-2xl shadow-sm p-6 overflow-x-auto">
          {activeReport === "daily" && (
            <DailySalesView data={reportData as DailySalesData} canViewProfit={canViewProfit} />
          )}
          {activeReport === "accounting" && (
            <AccountingOverviewView data={reportData as AccountingOverviewData} />
          )}
          {activeReport === "gst" && (
            <GSTView data={reportData as GSTReportData} />
          )}
          {activeReport === "products" && (
            <ProductSalesView data={reportData as ProductSalesData} />
          )}
          {activeReport === "outstanding" && (
            <OutstandingView data={reportData as OutstandingData} />
          )}
          {activeReport === "inventory" && (
            <InventoryView data={reportData as InventoryReportData} />
          )}
        </div>
      )}
    </div>
  );
}

interface DailySalesData {
  summary: { invoiceCount: number; totalSales: number; cashSales: number; upiSales: number; creditSales: number };
  invoices: { invoiceNumber: string; customer: string; totalAmount: number; paymentType: string; status: string }[];
}

function DailySalesView({ data, canViewProfit }: { data: DailySalesData; canViewProfit: boolean }) {
  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Stat label="Invoices" value={String(data.summary.invoiceCount)} />
        {canViewProfit && <Stat label="Total Sales" value={formatCurrency(data.summary.totalSales)} />}
        <Stat label="Cash" value={formatCurrency(data.summary.cashSales)} />
        <Stat label="UPI" value={formatCurrency(data.summary.upiSales)} />
      </div>
      <table className="w-full text-sm">
        <thead><tr className="bg-brand-cream"><th className="p-2 text-left">Invoice</th><th className="p-2 text-left">Customer</th><th className="p-2 text-right">Amount</th><th className="p-2">Payment</th></tr></thead>
        <tbody>
          {data.invoices.map((inv, i) => (
            <tr key={i} className="border-b"><td className="p-2">{inv.invoiceNumber}</td><td className="p-2">{inv.customer}</td><td className="p-2 text-right">{formatCurrency(inv.totalAmount)}</td><td className="p-2 text-center">{inv.paymentType}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface AccountingOverviewData {
  summary: {
    totalSales: number;
    totalExpenses: number;
    netProfit: number;
    totalReceivables: number;
    totalPayables: number;
    grossMargin: number;
    cashFlow: number;
  };
  salesBreakdown: { cashSales: number; upiSales: number; creditSales: number };
  expenseBreakdown: { category: string; amount: number }[];
  recentLedger: { description: string; amount: number; type: string; balance: number }[];
}

function AccountingOverviewView({ data }: { data: AccountingOverviewData }) {
  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Stat label="Sales" value={formatCurrency(data.summary.totalSales)} />
        <Stat label="Expenses" value={formatCurrency(data.summary.totalExpenses)} />
        <Stat label="Net Profit" value={formatCurrency(data.summary.netProfit)} />
        <Stat label="Gross Margin" value={`${data.summary.grossMargin.toFixed(1)}%`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Stat label="Cash Sales" value={formatCurrency(data.salesBreakdown.cashSales)} />
        <Stat label="UPI Sales" value={formatCurrency(data.salesBreakdown.upiSales)} />
        <Stat label="Credit Sales" value={formatCurrency(data.salesBreakdown.creditSales)} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-3">Expense Breakdown</h3>
          <table className="w-full text-sm">
            <thead><tr className="bg-brand-cream"><th className="p-2 text-left">Category</th><th className="p-2 text-right">Amount</th></tr></thead>
            <tbody>
              {data.expenseBreakdown.map((entry, index) => (
                <tr key={`${entry.category}-${index}`} className="border-b"><td className="p-2">{entry.category}</td><td className="p-2 text-right">{formatCurrency(entry.amount)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">Account Position</h3>
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b"><td className="p-2">Receivables</td><td className="p-2 text-right">{formatCurrency(data.summary.totalReceivables)}</td></tr>
              <tr className="border-b"><td className="p-2">Payables</td><td className="p-2 text-right">{formatCurrency(data.summary.totalPayables)}</td></tr>
              <tr className="border-b"><td className="p-2">Cash Flow</td><td className="p-2 text-right">{formatCurrency(data.summary.cashFlow)}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

interface GSTReportData {
  period?: { from: string; to: string };
  summary: {
    totalSales: number;
    taxableSales: number;
    gstCollected: number;
    totalPurchases: number;
    inputTax: number;
    netTaxLiability: number;
    cashSales: number;
    upiSales: number;
    creditSales: number;
  };
  invoiceBreakdown: { invoiceNumber: string; customer: string; type: string; taxableAmount: number; gstAmount: number; totalAmount: number }[];
  purchaseBreakdown: { invoiceNumber: string; supplier: string; taxableAmount: number; gstAmount: number; totalAmount: number }[];
}

function GSTView({ data }: { data: GSTReportData }) {
  const periodLabel = data.period
    ? `${new Date(data.period.from).toLocaleDateString("en-IN")} – ${new Date(data.period.to).toLocaleDateString("en-IN")}`
    : "Selected period";

  return (
    <div>
      <p className="mb-4 text-sm text-brand-muted">Period: {periodLabel}</p>

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
          <p className="text-sm font-semibold text-emerald-900">Sales (Output tax)</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <GstMetric label="Gross sales" value={formatCurrency(data.summary.totalSales)} />
            <GstMetric label="Taxable value" value={formatCurrency(data.summary.taxableSales)} />
            <GstMetric label="GST collected" value={formatCurrency(data.summary.gstCollected)} highlight />
            <GstMetric label="Credit sales" value={formatCurrency(data.summary.creditSales)} />
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
          <p className="text-sm font-semibold text-amber-900">Purchases (Input tax)</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <GstMetric label="Purchase total" value={formatCurrency(data.summary.totalPurchases)} />
            <GstMetric label="Input tax credit" value={formatCurrency(data.summary.inputTax)} highlight />
            <GstMetric label="Cash sales" value={formatCurrency(data.summary.cashSales)} />
            <GstMetric label="UPI sales" value={formatCurrency(data.summary.upiSales)} />
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border-2 border-brand-emerald/20 bg-white p-5">
        <p className="text-sm text-brand-muted">Net tax liability (Output − Input)</p>
        <p className="mt-1 text-3xl font-bold text-brand-charcoal">{formatCurrency(data.summary.netTaxLiability)}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="mb-3 text-lg font-semibold">Sales GST breakdown</h3>
          <table className="w-full text-sm">
            <thead><tr className="bg-brand-cream"><th className="p-2 text-left">Invoice</th><th className="p-2 text-left">Customer</th><th className="p-2 text-right">Taxable</th><th className="p-2 text-right">GST</th></tr></thead>
            <tbody>
              {data.invoiceBreakdown.map((entry, i) => (
                <tr key={`${entry.invoiceNumber}-${i}`} className="border-b"><td className="p-2">{entry.invoiceNumber}</td><td className="p-2">{entry.customer}</td><td className="p-2 text-right">{formatCurrency(entry.taxableAmount)}</td><td className="p-2 text-right">{formatCurrency(entry.gstAmount)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <h3 className="mb-3 text-lg font-semibold">Purchase GST breakdown</h3>
          <table className="w-full text-sm">
            <thead><tr className="bg-brand-cream"><th className="p-2 text-left">Invoice</th><th className="p-2 text-left">Supplier</th><th className="p-2 text-right">Taxable</th><th className="p-2 text-right">Input Tax</th></tr></thead>
            <tbody>
              {data.purchaseBreakdown.map((entry, i) => (
                <tr key={`${entry.invoiceNumber}-${i}`} className="border-b"><td className="p-2">{entry.invoiceNumber}</td><td className="p-2">{entry.supplier}</td><td className="p-2 text-right">{formatCurrency(entry.taxableAmount)}</td><td className="p-2 text-right">{formatCurrency(entry.gstAmount)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function GstMetric({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-3 ${highlight ? "bg-white shadow-sm" : "bg-white/70"}`}>
      <p className="text-xs text-brand-muted">{label}</p>
      <p className="text-base font-bold text-brand-charcoal">{value}</p>
    </div>
  );
}

interface ProductSalesData {
  totalRevenue: number;
  products: { marathiName: string | null; name: string; category: string; totalQuantity: number; totalAmount: number }[];
}

function ProductSalesView({ data }: { data: ProductSalesData }) {
  return (
    <div>
      <p className="mb-4 font-semibold">Total Revenue: {formatCurrency(data.totalRevenue)}</p>
      <table className="w-full text-sm">
        <thead><tr className="bg-brand-cream"><th className="p-2 text-left">Product</th><th className="p-2">Category</th><th className="p-2 text-right">Qty</th><th className="p-2 text-right">Revenue</th></tr></thead>
        <tbody>
          {data.products.map((p, i) => (
            <tr key={i} className="border-b"><td className="p-2">{p.marathiName || p.name}</td><td className="p-2 text-center">{p.category}</td><td className="p-2 text-right">{p.totalQuantity}</td><td className="p-2 text-right">{formatCurrency(p.totalAmount)}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface OutstandingData {
  totalOutstanding: number;
  customers: { name: string; mobile: string; outstandingAmount: number; creditLimit: number }[];
}

function OutstandingView({ data }: { data: OutstandingData }) {
  return (
    <div>
      <p className="mb-4 font-semibold text-red-600">Total Outstanding: {formatCurrency(data.totalOutstanding)}</p>
      <table className="w-full text-sm">
        <thead><tr className="bg-brand-cream"><th className="p-2 text-left">Customer</th><th className="p-2">Mobile</th><th className="p-2 text-right">Outstanding</th><th className="p-2 text-right">Credit Limit</th></tr></thead>
        <tbody>
          {data.customers.map((c, i) => (
            <tr key={i} className="border-b"><td className="p-2">{c.name}</td><td className="p-2">{c.mobile}</td><td className="p-2 text-right font-semibold">{formatCurrency(c.outstandingAmount)}</td><td className="p-2 text-right">{formatCurrency(c.creditLimit)}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface InventoryReportData {
  totalProducts: number;
  lowStockCount: number;
  totalStockValue: number;
  products: { marathiName: string | null; name: string; category: string; currentStock: number; stockValue: number; isLowStock: boolean }[];
}

function InventoryView({ data }: { data: InventoryReportData }) {
  return (
    <div>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <Stat label="Products" value={String(data.totalProducts)} />
        <Stat label="Low Stock" value={String(data.lowStockCount)} />
        <Stat label="Stock Value" value={formatCurrency(data.totalStockValue)} />
      </div>
      <table className="w-full text-sm">
        <thead><tr className="bg-brand-cream"><th className="p-2 text-left">Product</th><th className="p-2">Category</th><th className="p-2 text-right">Stock</th><th className="p-2 text-right">Value</th><th className="p-2">Alert</th></tr></thead>
        <tbody>
          {data.products.map((p, i) => (
            <tr key={i} className="border-b"><td className="p-2">{p.marathiName || p.name}</td><td className="p-2">{p.category}</td><td className="p-2 text-right">{p.currentStock}</td><td className="p-2 text-right">{formatCurrency(p.stockValue)}</td><td className="p-2 text-center">{p.isLowStock ? "⚠️" : "✓"}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-brand-cream rounded-xl p-4">
      <p className="text-xs text-brand-muted">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}
