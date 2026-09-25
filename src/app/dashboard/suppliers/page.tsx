"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Briefcase, Plus, Search, Edit, Trash2, Eye } from "lucide-react";

interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  mobile: string;
  city: string;
  rating: number;
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await fetch("/api/suppliers");
      const data = await response.json();
      setSuppliers(data);
    } catch {
      console.error("Failed to fetch suppliers");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this supplier?")) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/suppliers/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSuppliers(suppliers.filter((s) => s.id !== id));
      } else {
        alert("Failed to delete supplier");
      }
    } catch {
      console.error("Delete error");
      alert("Error deleting supplier");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredSuppliers = suppliers.filter((supplier) =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.mobile.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Suppliers</h1>
          <p className="text-gray-600 mt-1">Manage supplier information and relationships</p>
        </div>
        <Link
          href="/dashboard/suppliers/new"
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition"
        >
          <Plus size={20} />
          Add Supplier
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search by name or mobile..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-600">Loading suppliers...</div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="p-8 text-center text-gray-600">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p>No suppliers found. Add your first supplier!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Supplier Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Contact Person</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Mobile</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">City</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Rating</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{supplier.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{supplier.contactPerson || "-"}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{supplier.mobile}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{supplier.city}</td>
                    <td className="px-6 py-4 text-sm">{"⭐".repeat(Math.round(supplier.rating))}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <Link href={`/dashboard/suppliers/${supplier.id}`} className="text-emerald-600 hover:text-emerald-800" title="View supplier">
                          <Eye size={18} />
                        </Link>
                        <Link href={`/dashboard/suppliers/${supplier.id}/edit`} className="text-blue-600 hover:text-blue-800">
                          <Edit size={18} />
                        </Link>
                        <button
                          onClick={() => handleDelete(supplier.id)}
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
