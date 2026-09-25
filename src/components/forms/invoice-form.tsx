"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, AlertCircle, CheckCircle, Plus, X } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  city?: string;
}

interface Product {
  id: string;
  name: string;
  sellingRate: number;
}

interface InvoiceInitialData {
  id?: string;
  customerId?: string;
  discount?: number;
  items?: LineItem[];
}

interface InvoiceFormProps {
  initialData?: InvoiceInitialData;
  isEditing?: boolean;
}

interface LineItem {
  productId: string;
  productName: string;
  quantity: number;
  rate: number;
  total: number;
}

export default function InvoiceForm({ initialData, isEditing }: InvoiceFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState(initialData?.customerId || "");
  const [discount, setDiscount] = useState(initialData?.discount || 0);
  const [lineItems, setLineItems] = useState<LineItem[]>(initialData?.items || []);

  useEffect(() => {
    fetchCustomers();
    fetchProducts();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/customers");
      const data = await response.json();
      setCustomers(data);
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products");
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  };

  const handleAddItem = () => {
    setLineItems([
      ...lineItems,
      { productId: "", productName: "", quantity: 1, rate: 0, total: 0 },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: string) => {
    const newItems = [...lineItems];
    const item = newItems[index];

    if (field === "productId") {
      const product = products.find((p) => p.id === value);
      item.productId = value;
      item.productName = product?.name || "";
      item.rate = product?.sellingRate || 0;
    } else if (field === "quantity") {
      item.quantity = parseFloat(value) || 0;
    } else if (field === "rate") {
      item.rate = parseFloat(value) || 0;
    }

    item.total = item.quantity * item.rate;
    setLineItems(newItems);
  };

  const calculateSubtotal = () =>
    lineItems.reduce((sum, item) => sum + item.total, 0);

  const calculateGST = () => {
    // Assuming 5% GST for simplicity
    return calculateSubtotal() * 0.05;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const gst = calculateGST();
    return subtotal + gst - discount;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsLoading(true);

    if (!selectedCustomer) {
      setError("Please select a customer");
      setIsLoading(false);
      return;
    }

    if (lineItems.length === 0) {
      setError("Please add at least one item");
      setIsLoading(false);
      return;
    }

    try {
      const url = isEditing ? `/api/invoices/${initialData?.id}` : "/api/invoices";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomer,
          discount,
          items: lineItems,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to save invoice");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard/billing");
      }, 1500);
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const subtotal = calculateSubtotal();
  const gst = calculateGST();
  const total = calculateTotal();

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/dashboard/billing"
          className="text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditing ? "Edit Invoice" : "Create New Invoice"}
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
              {isEditing ? "Invoice updated successfully!" : "Invoice created successfully!"}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer *
            </label>
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              disabled={isLoading}
            >
              <option value="">Select a customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} ({customer.city})
                </option>
              ))}
            </select>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Invoice Items</h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg transition text-sm"
                disabled={isLoading}
              >
                <Plus size={16} />
                Add Item
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold text-gray-900">Product</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-900">Qty</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-900">Rate (₹)</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-900">Total (₹)</th>
                    <th className="px-4 py-2 text-center font-semibold text-gray-900">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {lineItems.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-2">
                        <select
                          value={item.productId}
                          onChange={(e) =>
                            handleItemChange(index, "productId", e.target.value)
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500 outline-none"
                          disabled={isLoading}
                        >
                          <option value="">Select product</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(index, "quantity", e.target.value)
                          }
                          step="0.1"
                          min="0"
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500 outline-none"
                          disabled={isLoading}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          value={item.rate}
                          onChange={(e) =>
                            handleItemChange(index, "rate", e.target.value)
                          }
                          step="0.01"
                          min="0"
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500 outline-none"
                          disabled={isLoading}
                        />
                      </td>
                      <td className="px-4 py-2 font-semibold text-gray-900">
                        ₹{item.total.toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="text-red-600 hover:text-red-800 disabled:opacity-50"
                          disabled={isLoading}
                        >
                          <X size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div></div>
            <div className="space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>GST (5%):</span>
                <span>₹{gst.toFixed(2)}</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount (₹)
                </label>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  step="100"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  disabled={isLoading}
                />
              </div>
              <div className="border-t border-gray-200 pt-3 font-semibold text-lg">
                <div className="flex justify-between text-emerald-600">
                  <span>Total:</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2 rounded-lg transition"
            >
              {isLoading ? "Saving..." : isEditing ? "Update Invoice" : "Create Invoice"}
            </button>
            <Link
              href="/dashboard/billing"
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
