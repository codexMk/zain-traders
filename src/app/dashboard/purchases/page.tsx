"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingCart, Plus, Search, Edit, Trash2, Eye } from "lucide-react";

interface Purchase {
  id: string;
  purchaseNumber: string;
  supplierName: string;
  total: number;
  createdAt: string;
  status: string;
  approvalStatus?: string;
  paymentStatus?: string;
  paidAmount?: number;
}

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
      const response = await fetch("/api/purchases");
      const data = (await response.json()) as Purchase[];
      setPurchases(data);
    } catch (error) {
      console.error("Failed to fetch purchases:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this purchase order?")) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/purchases/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setPurchases((current) => current.filter((purchase) => purchase.id !== id));
      } else {
        alert("Failed to delete purchase order");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Error deleting purchase order");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredPurchases = purchases.filter(
    (purchase) =>
      purchase.purchaseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getApprovalColor = (status: string) => {
    switch (status) {
      case "APPROVED":
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentColor = (status?: string) => {
    switch (status) {
      case "PAID":
        return "bg-emerald-100 text-emerald-800";
      case "PARTIALLY_PAID":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-sky-100 text-sky-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Purchase Orders</h1>
          <p className="text-gray-600 mt-1">Manage purchase orders from suppliers</p>
        </div>
        <Link
          href="/dashboard/purchases/new"
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition"
        >
          <Plus size={20} />
          New Purchase Order
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search by PO number or supplier..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-600">Loading purchase orders...</div>
        ) : filteredPurchases.length === 0 ? (
          <div className="p-8 text-center text-gray-600">
            <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p>No purchase orders found. Create your first one!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">PO #</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Supplier</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Amount</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Receipt</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Payment</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPurchases.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{purchase.purchaseNumber}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{purchase.supplierName}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900">₹{purchase.total.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(purchase.createdAt).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getApprovalColor(purchase.approvalStatus ?? purchase.status)}`}>
                        {purchase.approvalStatus ?? purchase.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPaymentColor(purchase.paymentStatus)}`}>
                        {purchase.paymentStatus ?? "UNPAID"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <Link
                          href={`/dashboard/purchases/${purchase.id}`}
                          className="text-emerald-600 hover:text-emerald-800"
                          title="View purchase"
                        >
                          <Eye size={18} />
                        </Link>
                        <Link
                          href={`/dashboard/purchases/${purchase.id}/edit`}
                          className="text-yellow-600 hover:text-yellow-800"
                        >
                          <Edit size={18} />
                        </Link>
                        <button
                          onClick={() => handleDelete(purchase.id)}
                          className="text-red-600 hover:text-red-800 disabled:opacity-50"
                          disabled={isDeleting}
                        >
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
