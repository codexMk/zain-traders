"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Plus, Search, Eye, Trash2 } from "lucide-react";

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  total: number;
  status: string;
  createdAt: string;
}

function isInvoiceList(value: unknown): value is Invoice[] {
  return Array.isArray(value) && value.every((invoice: unknown) => {
    if (typeof invoice !== "object" || invoice === null || Array.isArray(invoice)) return false;
    const row = invoice as Record<string, unknown>;
    return (
      typeof row.id === "string" &&
      typeof row.invoiceNumber === "string" &&
      typeof row.customerName === "string" &&
      typeof row.total === "number" &&
      typeof row.status === "string" &&
      typeof row.createdAt === "string"
    );
  });
}

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/invoices");
      const data: unknown = await response.json();
      if (!response.ok) {
        const message =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof data.error === "string"
            ? data.error
            : "Could not load invoices";
        throw new Error(message);
      }
      if (!isInvoiceList(data)) {
        throw new Error("The server returned an unexpected invoice response");
      }
      setInvoices(data);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load invoices");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredInvoices = invoices.filter(
    (invoice) =>
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-800";
      case "OVERDUE":
        return "bg-red-100 text-red-800";
      case "SENT":
        return "bg-blue-100 text-blue-800";
      case "DRAFT":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Billing & Invoices</h1>
          <p className="text-gray-600 mt-1">Create and manage invoices with GST</p>
        </div>
        <Link
          href="/dashboard/billing/new"
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition"
        >
          <Plus size={20} />
          New Invoice
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search by invoice number or customer..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-600">Loading invoices...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-700" role="alert">
            <p>{error}</p>
            <button onClick={fetchInvoices} className="mt-3 font-semibold underline">
              Try again
            </button>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-8 text-center text-gray-600">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p>No invoices found. Create your first invoice!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Invoice #</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Customer</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Amount</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{invoice.invoiceNumber}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{invoice.customerName}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900">₹{invoice.total.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(invoice.createdAt).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <Link
                          href={`/dashboard/billing/${invoice.id}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Eye size={18} />
                        </Link>
                        <button className="text-red-600 hover:text-red-800">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
