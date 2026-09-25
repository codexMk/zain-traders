"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { FileText, Plus, Search, Eye, Trash2, Copy } from "lucide-react";
import { formatCurrency } from "@/lib/invoice-utils";
import { permissions } from "@/lib/permissions";

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  total: number;
  status: string;
  paymentType: string;
  createdAt: string;
}

export default function BillingPage() {
  const { data: session } = useSession();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const canDelete = permissions.canDeleteInvoices(session?.user?.role ?? "STAFF");

  const fetchInvoices = () => {
    fetch("/api/invoices")
      .then((r) => r.json())
      .then(setInvoices)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete invoice? Stock will be restored.")) return;
    const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
    if (res.ok) fetchInvoices();
  };

  const handleDuplicate = async (id: string) => {
    const res = await fetch(`/api/invoices/${id}?action=duplicate`, { method: "POST" });
    if (res.ok) fetchInvoices();
  };

  const filteredInvoices = invoices.filter(
    (invoice) =>
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PAID: "bg-green-100 text-green-800",
      OVERDUE: "bg-red-100 text-red-800",
      SENT: "bg-blue-100 text-blue-800",
      DRAFT: "bg-gray-100 text-gray-800",
      PARTIALLY_PAID: "bg-yellow-100 text-yellow-800",
    };
    return colors[status] ?? "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-charcoal">Billing & Invoices</h1>
          <p className="text-brand-muted mt-1">GST & Non-GST invoices with PDF export</p>
        </div>
        <Link
          href="/dashboard/billing/new"
          className="flex items-center gap-2 bg-brand-gold hover:opacity-90 text-brand-charcoal px-6 py-3 rounded-2xl font-bold text-lg transition"
        >
          <Plus size={22} />
          New Invoice
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-4 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search invoice or customer..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 text-lg border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand-emerald outline-none"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-brand-muted">Loading invoices...</div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-12 text-center text-brand-muted">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p>No invoices yet. Create your first invoice!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-brand-emerald text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Invoice #</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Customer</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Amount</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Payment</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-brand-cream/50">
                    <td className="px-6 py-4 font-medium">{invoice.invoiceNumber}</td>
                    <td className="px-6 py-4 text-sm">{invoice.customerName}</td>
                    <td className="px-6 py-4 font-semibold">{formatCurrency(invoice.total)}</td>
                    <td className="px-6 py-4 text-sm">{invoice.paymentType}</td>
                    <td className="px-6 py-4 text-sm">
                      {new Date(invoice.createdAt).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-3">
                        <Link href={`/dashboard/billing/${invoice.id}`} className="text-brand-emerald hover:opacity-70">
                          <Eye size={20} />
                        </Link>
                        <button onClick={() => handleDuplicate(invoice.id)} className="text-brand-gold hover:opacity-70">
                          <Copy size={20} />
                        </button>
                        {canDelete && (
                          <button onClick={() => handleDelete(invoice.id)} className="text-red-600 hover:opacity-70">
                            <Trash2 size={20} />
                          </button>
                        )}
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
