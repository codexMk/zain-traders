"use client";

import { useEffect, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  IndianRupee,
  Landmark,
  ReceiptText,
  TrendingUp,
  Wallet,
} from "lucide-react";

interface AccountingSummary {
  receivables: number;
  payables: number;
  cashFlow: number;
  grossMargin: number;
}

interface AccountingSales {
  totalSales: number;
  cashSales: number;
  upiSales: number;
  creditSales: number;
}

interface ExpenseBreakdownItem {
  category: string;
  amount: number;
}

interface LedgerEntry {
  id: string;
  date: string;
  description: string;
  type: string;
  amount: number;
  balance: number;
  customer: string;
}

interface ReconciliationData {
  bucketTotals: {
    paid: { count: number; amount: number };
    due: { count: number; amount: number };
    overdue: { count: number; amount: number };
  };
  customerSummaries: {
    id: string;
    name: string;
    mobile: string;
    outstanding: number;
    invoiceCount: number;
    overdueCount: number;
  }[];
  supplierSummaries: {
    id: string;
    name: string;
    mobile: string;
    outstanding: number;
    openPurchases: number;
    pendingReceipts: number;
  }[];
  receivableLines: {
    id: string;
    invoiceNumber: string;
    customerName: string;
    dueDate: string | null;
    totalAmount: number;
    paidAmount: number;
    remaining: number;
    bucket: "paid" | "due" | "overdue";
    allocationLabel: string;
  }[];
}

interface AccountingResponse {
  summary: AccountingSummary;
  sales: AccountingSales;
  expenses: {
    totalExpenses: number;
    breakdown: ExpenseBreakdownItem[];
  };
  ledgerEntries: LedgerEntry[];
  reconciliation?: ReconciliationData;
}

interface CustomerOption {
  id: string;
  name: string;
  mobile: string;
  outstandingAmount: number;
  invoices: { id: string; invoiceNumber: string; totalAmount: number; paidAmount: number }[];
}

interface SupplierOption {
  id: string;
  name: string;
  purchases: { id: string; invoiceNumber: string; totalAmount: number; payments: { amount: number }[] }[];
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export default function AccountingPage() {
  const [summary, setSummary] = useState<AccountingSummary | null>(null);
  const [sales, setSales] = useState<AccountingSales | null>(null);
  const [expenses, setExpenses] = useState<{ totalExpenses: number; breakdown: ExpenseBreakdownItem[] } | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [reconciliation, setReconciliation] = useState<ReconciliationData | null>(null);
  const [receivableFilter, setReceivableFilter] = useState<"all" | "due" | "overdue">("all");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    category: "Transport",
    amount: "0",
    description: "",
    expenseDate: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [customerPaymentForm, setCustomerPaymentForm] = useState({
    customerId: "",
    invoiceId: "",
    amount: "0",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMethod: "CASH",
    reference: "",
    notes: "",
  });
  const [supplierPaymentForm, setSupplierPaymentForm] = useState({
    supplierId: "",
    purchaseId: "",
    amount: "0",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMethod: "CASH",
    reference: "",
    notes: "",
  });

  const fetchAccounting = async () => {
    try {
      const response = await fetch("/api/accounting");
      const data = (await response.json()) as AccountingResponse;
      setSummary(data.summary);
      setSales(data.sales);
      setExpenses(data.expenses);
      setLedgerEntries(data.ledgerEntries);
      setReconciliation(data.reconciliation ?? null);
    } catch (error) {
      console.error("Failed to load accounting data", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [customerResponse, supplierResponse] = await Promise.all([
        fetch("/api/customers"),
        fetch("/api/suppliers"),
      ]);

      const customerData = (await customerResponse.json()) as { id: string }[];
      const supplierData = (await supplierResponse.json()) as { id: string }[];

      const fullCustomers = await Promise.all(
        customerData.map(async (customer) => {
          const response = await fetch(`/api/customers/${customer.id}`);
          return (await response.json()) as CustomerOption;
        })
      );

      const fullSuppliers = await Promise.all(
        supplierData.map(async (supplier) => {
          const response = await fetch(`/api/suppliers/${supplier.id}`);
          return (await response.json()) as SupplierOption;
        })
      );

      setCustomers(fullCustomers);
      setSuppliers(fullSuppliers);
    } catch (error) {
      console.error("Failed to load customer or supplier metadata", error);
    }
  };

  useEffect(() => {
    fetchAccounting();
    fetchMetadata();
  }, []);

  const handleCustomerPaymentSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!customerPaymentForm.customerId || !customerPaymentForm.invoiceId) {
      return;
    }

    try {
      const response = await fetch(`/api/customers/${customerPaymentForm.customerId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: customerPaymentForm.invoiceId,
          amount: Number(customerPaymentForm.amount),
          paymentDate: customerPaymentForm.paymentDate,
          paymentMethod: customerPaymentForm.paymentMethod,
          reference: customerPaymentForm.reference || undefined,
          notes: customerPaymentForm.notes || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to record customer payment");
      }

      setCustomerPaymentForm({
        customerId: "",
        invoiceId: "",
        amount: "0",
        paymentDate: new Date().toISOString().split("T")[0],
        paymentMethod: "CASH",
        reference: "",
        notes: "",
      });
      await fetchAccounting();
      await fetchMetadata();
    } catch (error) {
      console.error(error);
    }
  };

  const handleSupplierPaymentSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!supplierPaymentForm.supplierId || !supplierPaymentForm.purchaseId) {
      return;
    }

    try {
      const response = await fetch(`/api/suppliers/${supplierPaymentForm.supplierId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purchaseId: supplierPaymentForm.purchaseId,
          amount: Number(supplierPaymentForm.amount),
          paymentDate: supplierPaymentForm.paymentDate,
          paymentMethod: supplierPaymentForm.paymentMethod,
          reference: supplierPaymentForm.reference || undefined,
          notes: supplierPaymentForm.notes || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to record supplier payment");
      }

      setSupplierPaymentForm({
        supplierId: "",
        purchaseId: "",
        amount: "0",
        paymentDate: new Date().toISOString().split("T")[0],
        paymentMethod: "CASH",
        reference: "",
        notes: "",
      });
      await fetchAccounting();
      await fetchMetadata();
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);

    try {
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: form.category,
          amount: Number(form.amount),
          description: form.description,
          expenseDate: form.expenseDate,
          notes: form.notes,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create expense");
      }

      setShowForm(false);
      setForm({
        category: "Transport",
        amount: "0",
        description: "",
        expenseDate: new Date().toISOString().split("T")[0],
        notes: "",
      });
      await fetchAccounting();
    } catch (error) {
      console.error("Failed to save expense", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="rounded-2xl border bg-white p-8 text-center text-brand-muted">Loading accounting data...</div>;
  }

  const cards = summary
    ? [
        {
          label: "Receivables",
          value: formatCurrency(summary.receivables),
          change: "Open customer balances",
          tone: "text-emerald-600",
          icon: ArrowUpRight,
          bg: "bg-emerald-50",
        },
        {
          label: "Payables",
          value: formatCurrency(summary.payables),
          change: "Supplier commitments",
          tone: "text-amber-600",
          icon: ArrowDownLeft,
          bg: "bg-amber-50",
        },
        {
          label: "Cash Flow",
          value: formatCurrency(summary.cashFlow),
          change: "This month net movement",
          tone: "text-brand-emerald",
          icon: Wallet,
          bg: "bg-brand-cream",
        },
        {
          label: "Gross Margin",
          value: `${summary.grossMargin.toFixed(1)}%`,
          change: "After operating expenses",
          tone: "text-brand-gold",
          icon: TrendingUp,
          bg: "bg-yellow-50",
        },
      ]
    : [];

  const expenseMix = expenses?.breakdown ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-charcoal">Accounting & Reconciliation</h1>
          <p className="text-brand-muted mt-1">Outstanding balances, payment allocation, and cash overview</p>
        </div>
        <button
          onClick={() => setShowForm((value) => !value)}
          className="flex items-center gap-2 rounded-2xl bg-brand-emerald px-5 py-3 text-sm font-semibold text-white shadow-sm hover:opacity-90"
        >
          <ReceiptText size={18} />
          {showForm ? "Close" : "Add Expense"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-brand-emerald/10 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm text-brand-muted">
              Category
              <input
                value={form.category}
                onChange={(event) => setForm({ ...form, category: event.target.value })}
                className="mt-1 w-full rounded-xl border border-brand-emerald/10 bg-brand-cream/30 px-3 py-2 text-brand-charcoal outline-none focus:border-brand-gold"
              />
            </label>
            <label className="block text-sm text-brand-muted">
              Amount
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(event) => setForm({ ...form, amount: event.target.value })}
                className="mt-1 w-full rounded-xl border border-brand-emerald/10 bg-brand-cream/30 px-3 py-2 text-brand-charcoal outline-none focus:border-brand-gold"
              />
            </label>
            <label className="block text-sm text-brand-muted md:col-span-2">
              Description
              <input
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                className="mt-1 w-full rounded-xl border border-brand-emerald/10 bg-brand-cream/30 px-3 py-2 text-brand-charcoal outline-none focus:border-brand-gold"
              />
            </label>
            <label className="block text-sm text-brand-muted">
              Expense Date
              <input
                type="date"
                value={form.expenseDate}
                onChange={(event) => setForm({ ...form, expenseDate: event.target.value })}
                className="mt-1 w-full rounded-xl border border-brand-emerald/10 bg-brand-cream/30 px-3 py-2 text-brand-charcoal outline-none focus:border-brand-gold"
              />
            </label>
            <label className="block text-sm text-brand-muted">
              Notes
              <input
                value={form.notes}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
                className="mt-1 w-full rounded-xl border border-brand-emerald/10 bg-brand-cream/30 px-3 py-2 text-brand-charcoal outline-none focus:border-brand-gold"
              />
            </label>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving || !form.description.trim() || Number(form.amount) <= 0}
              className="rounded-xl bg-brand-gold px-4 py-2.5 text-sm font-semibold text-brand-charcoal disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Expense"}
            </button>
          </div>
        </form>
      )}

      {reconciliation && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {(
              [
                { key: "due" as const, label: "Due soon", tone: "border-sky-200 bg-sky-50 text-sky-800" },
                { key: "overdue" as const, label: "Overdue", tone: "border-red-200 bg-red-50 text-red-800" },
                { key: "paid" as const, label: "Settled", tone: "border-emerald-200 bg-emerald-50 text-emerald-800" },
              ] as const
            ).map(({ key, label, tone }) => (
              <div key={key} className={`rounded-2xl border p-4 ${tone}`}>
                <p className="text-sm font-medium opacity-80">{label}</p>
                <p className="mt-1 text-2xl font-bold">{reconciliation.bucketTotals[key].count} invoices</p>
                <p className="mt-1 text-sm font-semibold">{formatCurrency(reconciliation.bucketTotals[key].amount)}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-2xl border border-brand-emerald/10 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-brand-charcoal">Customer outstanding</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b bg-brand-cream/60 text-left text-brand-muted">
                      <th className="px-3 py-2 font-medium">Customer</th>
                      <th className="px-3 py-2 font-medium text-right">Open invoices</th>
                      <th className="px-3 py-2 font-medium text-right">Overdue</th>
                      <th className="px-3 py-2 font-medium text-right">Outstanding</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-emerald/10">
                    {reconciliation.customerSummaries.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-3 py-6 text-center text-brand-muted">
                          All customer invoices are settled.
                        </td>
                      </tr>
                    ) : (
                      reconciliation.customerSummaries.slice(0, 8).map((row) => (
                        <tr key={row.id} className="hover:bg-brand-cream/40">
                          <td className="px-3 py-2">
                            <p className="font-medium text-brand-charcoal">{row.name}</p>
                            <p className="text-xs text-brand-muted">{row.mobile}</p>
                          </td>
                          <td className="px-3 py-2 text-right">{row.invoiceCount}</td>
                          <td className="px-3 py-2 text-right text-red-600">{row.overdueCount}</td>
                          <td className="px-3 py-2 text-right font-semibold">{formatCurrency(row.outstanding)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-2xl border border-brand-emerald/10 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-brand-charcoal">Supplier payables</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b bg-brand-cream/60 text-left text-brand-muted">
                      <th className="px-3 py-2 font-medium">Supplier</th>
                      <th className="px-3 py-2 font-medium text-right">Open POs</th>
                      <th className="px-3 py-2 font-medium text-right">Pending receipt</th>
                      <th className="px-3 py-2 font-medium text-right">Due</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-emerald/10">
                    {reconciliation.supplierSummaries.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-3 py-6 text-center text-brand-muted">
                          No open supplier balances.
                        </td>
                      </tr>
                    ) : (
                      reconciliation.supplierSummaries.slice(0, 8).map((row) => (
                        <tr key={row.id} className="hover:bg-brand-cream/40">
                          <td className="px-3 py-2">
                            <p className="font-medium text-brand-charcoal">{row.name}</p>
                            <p className="text-xs text-brand-muted">{row.mobile}</p>
                          </td>
                          <td className="px-3 py-2 text-right">{row.openPurchases}</td>
                          <td className="px-3 py-2 text-right text-amber-600">{row.pendingReceipts}</td>
                          <td className="px-3 py-2 text-right font-semibold">{formatCurrency(row.outstanding)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-brand-emerald/10 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-brand-charcoal">Receivable allocation queue</h2>
              <div className="flex gap-2">
                {(["all", "due", "overdue"] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setReceivableFilter(filter)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      receivableFilter === filter
                        ? "bg-brand-emerald text-white"
                        : "bg-brand-cream text-brand-muted"
                    }`}
                  >
                    {filter === "all" ? "All open" : filter === "due" ? "Due" : "Overdue"}
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b bg-brand-cream/60 text-left text-brand-muted">
                    <th className="px-3 py-2 font-medium">Invoice</th>
                    <th className="px-3 py-2 font-medium">Customer</th>
                    <th className="px-3 py-2 font-medium">Allocation</th>
                    <th className="px-3 py-2 font-medium text-right">Paid</th>
                    <th className="px-3 py-2 font-medium text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-emerald/10">
                  {reconciliation.receivableLines
                    .filter((line) => receivableFilter === "all" || line.bucket === receivableFilter)
                    .slice(0, 12)
                    .map((line) => (
                      <tr key={line.id} className="hover:bg-brand-cream/40">
                        <td className="px-3 py-2 font-medium text-brand-charcoal">{line.invoiceNumber}</td>
                        <td className="px-3 py-2 text-brand-muted">{line.customerName}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                              line.bucket === "overdue"
                                ? "bg-red-100 text-red-800"
                                : line.bucket === "due"
                                  ? "bg-sky-100 text-sky-800"
                                  : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {line.allocationLabel}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right">{formatCurrency(line.paidAmount)}</td>
                        <td className="px-3 py-2 text-right font-semibold">{formatCurrency(line.remaining)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, change, tone, icon: Icon, bg }) => (
          <div key={label} className="rounded-2xl border border-brand-emerald/10 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-brand-muted">{label}</p>
                <p className="mt-2 text-2xl font-bold text-brand-charcoal">{value}</p>
              </div>
              <div className={`${bg} rounded-xl p-3`}>
                <Icon className={tone} size={20} />
              </div>
            </div>
            <p className="mt-3 text-xs font-medium text-brand-muted">{change}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <form onSubmit={handleCustomerPaymentSubmit} className="rounded-2xl border border-brand-emerald/10 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-brand-charcoal">Record Customer Payment</h2>
            <Wallet className="text-emerald-600" size={18} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm text-brand-muted">
              Customer
              <select
                value={customerPaymentForm.customerId}
                onChange={(event) => {
                  const customerId = event.target.value;
                  const customer = customers.find((item) => item.id === customerId);
                  setCustomerPaymentForm((prev) => ({
                    ...prev,
                    customerId,
                    invoiceId: customer?.invoices[0]?.id ?? "",
                  }));
                }}
                className="mt-1 w-full rounded-xl border border-brand-emerald/10 bg-brand-cream/30 px-3 py-2 text-brand-charcoal outline-none focus:border-brand-gold"
              >
                <option value="">Select customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>{customer.name}</option>
                ))}
              </select>
            </label>

            <label className="text-sm text-brand-muted">
              Invoice
              <select
                value={customerPaymentForm.invoiceId}
                onChange={(event) =>
                  setCustomerPaymentForm((prev) => ({ ...prev, invoiceId: event.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-brand-emerald/10 bg-brand-cream/30 px-3 py-2 text-brand-charcoal outline-none focus:border-brand-gold"
              >
                <option value="">Select invoice</option>
                {(customers.find((customer) => customer.id === customerPaymentForm.customerId)?.invoices ?? []).map((invoice) => (
                  <option key={invoice.id} value={invoice.id}>
                    {invoice.invoiceNumber} • {formatCurrency(invoice.totalAmount - invoice.paidAmount)} due
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm text-brand-muted">
              Amount
              <input
                type="number"
                min="0"
                step="0.01"
                value={customerPaymentForm.amount}
                onChange={(event) => setCustomerPaymentForm((prev) => ({ ...prev, amount: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-brand-emerald/10 bg-brand-cream/30 px-3 py-2 text-brand-charcoal outline-none focus:border-brand-gold"
              />
            </label>

            <label className="text-sm text-brand-muted">
              Payment Date
              <input
                type="date"
                value={customerPaymentForm.paymentDate}
                onChange={(event) => setCustomerPaymentForm((prev) => ({ ...prev, paymentDate: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-brand-emerald/10 bg-brand-cream/30 px-3 py-2 text-brand-charcoal outline-none focus:border-brand-gold"
              />
            </label>

            <label className="text-sm text-brand-muted">
              Method
              <select
                value={customerPaymentForm.paymentMethod}
                onChange={(event) => setCustomerPaymentForm((prev) => ({ ...prev, paymentMethod: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-brand-emerald/10 bg-brand-cream/30 px-3 py-2 text-brand-charcoal outline-none focus:border-brand-gold"
              >
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="BANK">Bank</option>
              </select>
            </label>

            <label className="text-sm text-brand-muted">
              Reference
              <input
                value={customerPaymentForm.reference}
                onChange={(event) => setCustomerPaymentForm((prev) => ({ ...prev, reference: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-brand-emerald/10 bg-brand-cream/30 px-3 py-2 text-brand-charcoal outline-none focus:border-brand-gold"
              />
            </label>
          </div>

          <label className="block text-sm text-brand-muted">
            Notes
            <input
              value={customerPaymentForm.notes}
              onChange={(event) => setCustomerPaymentForm((prev) => ({ ...prev, notes: event.target.value }))}
              className="mt-1 w-full rounded-xl border border-brand-emerald/10 bg-brand-cream/30 px-3 py-2 text-brand-charcoal outline-none focus:border-brand-gold"
            />
          </label>

          <button type="submit" className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
            Save Customer Receipt
          </button>
        </form>

        <form onSubmit={handleSupplierPaymentSubmit} className="rounded-2xl border border-brand-emerald/10 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-brand-charcoal">Record Supplier Payment</h2>
            <ArrowDownLeft className="text-amber-600" size={18} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm text-brand-muted">
              Supplier
              <select
                value={supplierPaymentForm.supplierId}
                onChange={(event) => {
                  const supplierId = event.target.value;
                  const supplier = suppliers.find((item) => item.id === supplierId);
                  setSupplierPaymentForm((prev) => ({
                    ...prev,
                    supplierId,
                    purchaseId: supplier?.purchases[0]?.id ?? "",
                  }));
                }}
                className="mt-1 w-full rounded-xl border border-brand-emerald/10 bg-brand-cream/30 px-3 py-2 text-brand-charcoal outline-none focus:border-brand-gold"
              >
                <option value="">Select supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                ))}
              </select>
            </label>

            <label className="text-sm text-brand-muted">
              Purchase
              <select
                value={supplierPaymentForm.purchaseId}
                onChange={(event) => setSupplierPaymentForm((prev) => ({ ...prev, purchaseId: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-brand-emerald/10 bg-brand-cream/30 px-3 py-2 text-brand-charcoal outline-none focus:border-brand-gold"
              >
                <option value="">Select purchase</option>
                {(suppliers.find((supplier) => supplier.id === supplierPaymentForm.supplierId)?.purchases ?? []).map((purchase) => {
                  const remaining = purchase.totalAmount - purchase.payments.reduce((sum, payment) => sum + payment.amount, 0);
                  return (
                    <option key={purchase.id} value={purchase.id}>
                      {purchase.invoiceNumber} • {formatCurrency(remaining)} due
                    </option>
                  );
                })}
              </select>
            </label>

            <label className="text-sm text-brand-muted">
              Amount
              <input
                type="number"
                min="0"
                step="0.01"
                value={supplierPaymentForm.amount}
                onChange={(event) => setSupplierPaymentForm((prev) => ({ ...prev, amount: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-brand-emerald/10 bg-brand-cream/30 px-3 py-2 text-brand-charcoal outline-none focus:border-brand-gold"
              />
            </label>

            <label className="text-sm text-brand-muted">
              Payment Date
              <input
                type="date"
                value={supplierPaymentForm.paymentDate}
                onChange={(event) => setSupplierPaymentForm((prev) => ({ ...prev, paymentDate: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-brand-emerald/10 bg-brand-cream/30 px-3 py-2 text-brand-charcoal outline-none focus:border-brand-gold"
              />
            </label>

            <label className="text-sm text-brand-muted">
              Method
              <select
                value={supplierPaymentForm.paymentMethod}
                onChange={(event) => setSupplierPaymentForm((prev) => ({ ...prev, paymentMethod: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-brand-emerald/10 bg-brand-cream/30 px-3 py-2 text-brand-charcoal outline-none focus:border-brand-gold"
              >
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="BANK">Bank</option>
              </select>
            </label>

            <label className="text-sm text-brand-muted">
              Reference
              <input
                value={supplierPaymentForm.reference}
                onChange={(event) => setSupplierPaymentForm((prev) => ({ ...prev, reference: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-brand-emerald/10 bg-brand-cream/30 px-3 py-2 text-brand-charcoal outline-none focus:border-brand-gold"
              />
            </label>
          </div>

          <label className="block text-sm text-brand-muted">
            Notes
            <input
              value={supplierPaymentForm.notes}
              onChange={(event) => setSupplierPaymentForm((prev) => ({ ...prev, notes: event.target.value }))}
              className="mt-1 w-full rounded-xl border border-brand-emerald/10 bg-brand-cream/30 px-3 py-2 text-brand-charcoal outline-none focus:border-brand-gold"
            />
          </label>

          <button type="submit" className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
            Save Supplier Payment
          </button>
        </form>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="rounded-2xl border border-brand-emerald/10 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-brand-charcoal">Recent Ledger Activity</h2>
            <Landmark className="text-brand-emerald" size={18} />
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-brand-emerald/10 bg-brand-cream/60 text-left text-brand-muted">
                  <th className="px-3 py-3 font-medium">Date</th>
                  <th className="px-3 py-3 font-medium">Description</th>
                  <th className="px-3 py-3 font-medium">Type</th>
                  <th className="px-3 py-3 font-medium text-right">Amount</th>
                  <th className="px-3 py-3 font-medium text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-emerald/10">
                {ledgerEntries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-brand-muted">
                      No ledger entries yet.
                    </td>
                  </tr>
                ) : (
                  ledgerEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-brand-cream/40">
                      <td className="px-3 py-3 text-brand-muted">{new Date(entry.date).toLocaleDateString("en-IN")}</td>
                      <td className="px-3 py-3 text-brand-charcoal">{entry.description}</td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            entry.type === "Credit"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {entry.type}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right font-semibold text-brand-charcoal">
                        {formatCurrency(entry.amount)}
                      </td>
                      <td className="px-3 py-3 text-right font-medium text-brand-muted">
                        {formatCurrency(entry.balance)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-brand-emerald/10 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-brand-charcoal">Expense Mix</h2>
              <IndianRupee className="text-brand-gold" size={18} />
            </div>

            <div className="space-y-4">
              {expenseMix.length === 0 ? (
                <p className="text-sm text-brand-muted">No expense data yet.</p>
              ) : (
                expenseMix.map((item) => {
                  const max = Math.max(...expenseMix.map((entry) => entry.amount), 1);
                  const width = Math.min((item.amount / max) * 100, 100);

                  return (
                    <div key={item.category}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="text-brand-muted">{item.category}</span>
                        <span className="font-semibold text-brand-charcoal">{formatCurrency(item.amount)}</span>
                      </div>
                      <div className="h-2.5 rounded-full bg-brand-cream">
                        <div className="h-full rounded-full bg-brand-emerald" style={{ width: `${width}%` }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {sales && (
            <div className="rounded-2xl border border-brand-emerald/10 bg-brand-emerald p-5 text-white shadow-sm">
              <p className="text-sm text-white/80">This month</p>
              <p className="mt-3 text-3xl font-bold">{formatCurrency(sales.totalSales - (expenses?.totalExpenses ?? 0))}</p>
              <p className="mt-2 text-sm text-white/80">Net cash after expenses</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
