"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, AlertCircle, CheckCircle } from "lucide-react";

interface SupplierFormProps {
  initialData?: {
    id: string;
    name: string;
    contactPerson?: string;
    mobile: string;
    whatsapp?: string;
    city: string;
    address: string;
    gstNumber?: string;
    productCategories: string[];
  };
  isEditing?: boolean;
}

const CITIES = [
  "Mumbai",
  "Pune",
  "Solapur",
  "Dharashiv",
  "Bangalore",
  "Delhi",
  "Chennai",
  "Kolkata",
];

const PRODUCT_CATEGORIES = [
  { value: "WHOLE_SPICES", label: "Whole Spices" },
  { value: "POWDER_SPICES", label: "Powder Spices" },
  { value: "DRY_FRUITS", label: "Dry Fruits" },
  { value: "OTHER_PRODUCTS", label: "Other Products" },
];

export default function SupplierForm({ initialData, isEditing }: SupplierFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    contactPerson: initialData?.contactPerson || "",
    mobile: initialData?.mobile || "",
    whatsapp: initialData?.whatsapp || "",
    city: initialData?.city || "",
    address: initialData?.address || "",
    gstNumber: initialData?.gstNumber || "",
    productCategories: initialData?.productCategories || [],
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCategoryChange = (category: string) => {
    setFormData((prev) => ({
      ...prev,
      productCategories: prev.productCategories.includes(category)
        ? prev.productCategories.filter((c) => c !== category)
        : [...prev.productCategories, category],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsLoading(true);

    // Validation
    if (!formData.name.trim()) {
      setError("Supplier name is required");
      setIsLoading(false);
      return;
    }
    if (!formData.mobile.trim()) {
      setError("Mobile number is required");
      setIsLoading(false);
      return;
    }
    if (!formData.city.trim()) {
      setError("City is required");
      setIsLoading(false);
      return;
    }
    if (!formData.address.trim()) {
      setError("Address is required");
      setIsLoading(false);
      return;
    }

    try {
      const url = isEditing ? `/api/suppliers/${initialData?.id}` : "/api/suppliers";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to save supplier");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard/suppliers");
      }, 1500);
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/dashboard/suppliers"
          className="text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditing ? "Edit Supplier" : "Add New Supplier"}
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
              {isEditing ? "Supplier updated successfully!" : "Supplier created successfully!"}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supplier Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                placeholder="e.g., Mumbai Spice Co."
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Person
              </label>
              <input
                type="text"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                placeholder="e.g., Raj Patel"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mobile *
              </label>
              <input
                type="tel"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                placeholder="e.g., 9876543210"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                WhatsApp
              </label>
              <input
                type="tel"
                name="whatsapp"
                value={formData.whatsapp}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                placeholder="e.g., 9876543210"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City *
              </label>
              <select
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                disabled={isLoading}
              >
                <option value="">Select a city</option>
                {CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GST Number
              </label>
              <input
                type="text"
                name="gstNumber"
                value={formData.gstNumber}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                placeholder="e.g., 27AAACR1234H2Z5"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address *
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              placeholder="Full business address"
              disabled={isLoading}
            />
          </div>

          {/* Product Categories */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Product Categories
            </label>
            <div className="space-y-2">
              {PRODUCT_CATEGORIES.map((category) => (
                <label key={category.value} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.productCategories.includes(category.value)}
                    onChange={() => handleCategoryChange(category.value)}
                    disabled={isLoading}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span className="text-gray-700">{category.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2 rounded-lg transition"
            >
              {isLoading ? "Saving..." : isEditing ? "Update Supplier" : "Add Supplier"}
            </button>
            <Link
              href="/dashboard/suppliers"
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
