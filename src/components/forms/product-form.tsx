"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, AlertCircle, CheckCircle } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ProductFormProps {
  initialData?: {
    id: string;
    name: string;
    marathiName?: string;
    sku: string;
    categoryId?: string;
    category?: { id: string; name: string };
    unit: string;
    hsnCode?: string;
    gstPercentage: number;
    purchaseRate: number;
    sellingRate: number;
    minimumStockLevel: number;
  };
  isEditing?: boolean;
}

const UNITS = [
  { value: "KG", label: "Kilogram (KG)" },
  { value: "GRAM", label: "Gram (G)" },
  { value: "BAG", label: "Bag" },
  { value: "PIECE", label: "Piece" },
];

export default function ProductForm({ initialData, isEditing }: ProductFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    marathiName: initialData?.marathiName || "",
    sku: initialData?.sku || "",
    categoryId: initialData?.categoryId || initialData?.category?.id || "",
    unit: initialData?.unit || "KG",
    hsnCode: initialData?.hsnCode || "",
    gstPercentage: initialData?.gstPercentage || 5,
    purchaseRate: initialData?.purchaseRate || 0,
    sellingRate: initialData?.sellingRate || 0,
    minimumStockLevel: initialData?.minimumStockLevel || 0,
  });

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data: Category[]) => {
        setCategories(data);
        if (!formData.categoryId && data.length > 0) {
          setFormData((prev) => ({ ...prev, categoryId: data[0].id }));
        }
      })
      .catch(console.error);
  }, [formData.categoryId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name.includes("Rate") || name.includes("GST") || name.includes("Level")
        ? parseFloat(value) || 0
        : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsLoading(true);

    // Validation
    if (!formData.name.trim()) {
      setError("Product name is required");
      setIsLoading(false);
      return;
    }
    if (!formData.sku.trim()) {
      setError("SKU is required");
      setIsLoading(false);
      return;
    }
    if (formData.purchaseRate <= 0) {
      setError("Purchase rate must be greater than 0");
      setIsLoading(false);
      return;
    }
    if (formData.sellingRate <= 0) {
      setError("Selling rate must be greater than 0");
      setIsLoading(false);
      return;
    }

    try {
      const url = isEditing ? `/api/products/${initialData?.id}` : "/api/products";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to save product");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard/products");
      }, 1500);
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const margin = formData.purchaseRate > 0
    ? (((formData.sellingRate - formData.purchaseRate) / formData.sellingRate) * 100).toFixed(2)
    : 0;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/dashboard/products"
          className="text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditing ? "Edit Product" : "Create New Product"}
        </h1>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3">
            <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
            <p className="text-green-700">
              {isEditing ? "Product updated successfully!" : "Product created successfully!"}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                placeholder="e.g., Jeera"
                disabled={isLoading}
              />
            </div>

            {/* Marathi Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Marathi Name
              </label>
              <input
                type="text"
                name="marathiName"
                value={formData.marathiName}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                placeholder="e.g., जिरा"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* SKU and HSN Code */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SKU *
              </label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                placeholder="e.g., JEERA-001"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                HSN Code
              </label>
              <input
                type="text"
                name="hsnCode"
                value={formData.hsnCode}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                placeholder="e.g., 0908.10"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Category and Unit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                disabled={isLoading}
                required
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit *
              </label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                disabled={isLoading}
              >
                {UNITS.map((unit) => (
                  <option key={unit.value} value={unit.value}>
                    {unit.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* GST Percentage */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              GST Percentage (%)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="number"
                name="gstPercentage"
                value={formData.gstPercentage}
                onChange={handleChange}
                step="0.1"
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                placeholder="5"
                disabled={isLoading}
              />
              <span className="text-sm text-gray-600">Default: 5%</span>
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Purchase Rate (₹) *
              </label>
              <input
                type="number"
                name="purchaseRate"
                value={formData.purchaseRate}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                placeholder="0.00"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selling Rate (₹) *
              </label>
              <input
                type="number"
                name="sellingRate"
                value={formData.sellingRate}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                placeholder="0.00"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Margin %
              </label>
              <div className="px-4 py-2 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-900 font-semibold">
                {margin}%
              </div>
            </div>
          </div>

          {/* Minimum Stock Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Stock Level
            </label>
            <input
              type="number"
              name="minimumStockLevel"
              value={formData.minimumStockLevel}
              onChange={handleChange}
              step="0.1"
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              placeholder="0"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Alert when stock falls below this level
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2 rounded-lg transition"
            >
              {isLoading ? "Saving..." : isEditing ? "Update Product" : "Create Product"}
            </button>
            <Link
              href="/dashboard/products"
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-2 rounded-lg transition text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
