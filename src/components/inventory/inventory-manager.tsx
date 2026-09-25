"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ArrowDownCircle, ArrowUpCircle, Package, History } from "lucide-react";
import { formatCurrency } from "@/lib/invoice-utils";
import { useSession } from "next-auth/react";
import { permissions } from "@/lib/permissions";

interface InventoryItem {
  id: string;
  name: string;
  marathiName?: string | null;
  sku: string;
  category: string;
  unit: string;
  currentStock: number;
  minimumStockLevel: number;
  isLowStock: boolean;
  purchaseRate: number;
  sellingRate: number;
}

interface Summary {
  totalProducts: number;
  lowStockCount: number;
  totalStockValue: number;
}

export default function InventoryManager() {
  const { data: session } = useSession();
  const canManageStock = permissions.canManageStock(session?.user?.role ?? "STAFF");

  const [summary, setSummary] = useState<Summary | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showLowOnly, setShowLowOnly] = useState(false);

  const [movementForm, setMovementForm] = useState({
    productId: "",
    movementType: "STOCK_IN" as "STOCK_IN" | "STOCK_OUT" | "DAMAGED",
    quantity: 0,
    notes: "",
  });
  const [movementLoading, setMovementLoading] = useState(false);
  const [movementError, setMovementError] = useState<string | null>(null);

  const fetchInventory = () => {
    fetch("/api/inventory")
      .then((r) => r.json())
      .then((data) => {
        setSummary(data.summary);
        setInventory(data.inventory);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const filtered = inventory.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.marathiName?.includes(search) ?? false) ||
      item.sku.toLowerCase().includes(search.toLowerCase());
    const matchesLow = !showLowOnly || item.isLowStock;
    return matchesSearch && matchesLow;
  });

  const handleMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    setMovementError(null);
    setMovementLoading(true);

    try {
      const res = await fetch("/api/inventory/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(movementForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setMovementError(data.error);
        return;
      }
      setMovementForm({ productId: "", movementType: "STOCK_IN", quantity: 0, notes: "" });
      fetchInventory();
    } catch {
      setMovementError("Failed to record movement");
    } finally {
      setMovementLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-emerald/20 border-r-brand-emerald" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-6 border-l-4 border-brand-emerald shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-brand-muted text-sm">Total Products</p>
              <p className="text-3xl font-bold">{summary?.totalProducts ?? 0}</p>
            </div>
            <Package className="text-brand-emerald" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border-l-4 border-amber-500 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-brand-muted text-sm">Low Stock Alerts</p>
              <p className="text-3xl font-bold text-amber-600">{summary?.lowStockCount ?? 0}</p>
            </div>
            <AlertTriangle className="text-amber-500" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border-l-4 border-brand-gold shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-brand-muted text-sm">Stock Value</p>
              <p className="text-2xl font-bold">{formatCurrency(summary?.totalStockValue ?? 0)}</p>
            </div>
            <History className="text-brand-gold" size={32} />
          </div>
        </div>
      </div>

      {canManageStock && (
        <form onSubmit={handleMovement} className="bg-white rounded-2xl p-6 shadow-sm border border-brand-gold/20">
          <h2 className="font-semibold text-brand-emerald mb-4">Stock Movement</h2>
          {movementError && (
            <p className="text-red-600 text-sm mb-3">{movementError}</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <select
              value={movementForm.productId}
              onChange={(e) => setMovementForm({ ...movementForm, productId: e.target.value })}
              className="px-4 py-3 border rounded-xl md:col-span-2"
              required
            >
              <option value="">Select Product</option>
              {inventory.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.marathiName || p.name} (Stock: {p.currentStock})
                </option>
              ))}
            </select>
            <select
              value={movementForm.movementType}
              onChange={(e) =>
                setMovementForm({
                  ...movementForm,
                  movementType: e.target.value as typeof movementForm.movementType,
                })
              }
              className="px-4 py-3 border rounded-xl"
            >
              <option value="STOCK_IN">Stock In</option>
              <option value="STOCK_OUT">Stock Out</option>
              <option value="DAMAGED">Damaged</option>
            </select>
            <input
              type="number"
              placeholder="Quantity"
              value={movementForm.quantity || ""}
              onChange={(e) =>
                setMovementForm({ ...movementForm, quantity: parseFloat(e.target.value) || 0 })
              }
              className="px-4 py-3 border rounded-xl"
              min={0.1}
              step={0.1}
              required
            />
            <button
              type="submit"
              disabled={movementLoading}
              className="py-3 bg-brand-emerald text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50"
            >
              {movementLoading ? "Saving..." : "Record"}
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-wrap gap-4">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-3 border rounded-xl"
        />
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showLowOnly}
            onChange={(e) => setShowLowOnly(e.target.checked)}
            className="w-5 h-5 accent-brand-emerald"
          />
          <span>Low stock only</span>
        </label>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-brand-emerald text-white">
            <tr>
              <th className="px-4 py-3 text-left">Product</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-right">Stock</th>
              <th className="px-4 py-3 text-right">Min Level</th>
              <th className="px-4 py-3 text-right">Purchase Rate</th>
              <th className="px-4 py-3 text-right">Selling Rate</th>
              <th className="px-4 py-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id} className="border-b hover:bg-brand-cream/50">
                <td className="px-4 py-3">
                  <div className="font-medium">{item.marathiName || item.name}</div>
                  <div className="text-xs text-brand-muted">{item.sku}</div>
                </td>
                <td className="px-4 py-3">{item.category}</td>
                <td className="px-4 py-3 text-right font-semibold">
                  {item.currentStock} {item.unit}
                </td>
                <td className="px-4 py-3 text-right">{item.minimumStockLevel}</td>
                <td className="px-4 py-3 text-right">₹{item.purchaseRate}</td>
                <td className="px-4 py-3 text-right">₹{item.sellingRate}</td>
                <td className="px-4 py-3 text-center">
                  {item.isLowStock ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold">
                      <ArrowDownCircle size={12} /> Low
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                      <ArrowUpCircle size={12} /> OK
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
