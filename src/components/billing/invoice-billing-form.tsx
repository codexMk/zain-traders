"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  AlertCircle,
  CheckCircle,
  X,
  Search,
  Save,
  Keyboard,
} from "lucide-react";
import { formatCurrency } from "@/lib/invoice-utils";

interface Customer {
  id: string;
  name: string;
  mobile: string;
  address: string;
}

interface Product {
  id: string;
  name: string;
  marathiName?: string | null;
  sellingRate: number;
  gstPercentage: number;
  currentStock: number;
  unit: string;
}

interface LineItem {
  productId: string;
  productName: string;
  quantity: number;
  rate: number;
  discountPercent: number;
  discountAmount: number;
  gstPercent: number;
  stock: number;
  unit: string;
}

export default function InvoiceBillingForm() {
  const router = useRouter();
  const productSearchRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState("");

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  const [gstEnabled, setGstEnabled] = useState(true);
  const [invoiceType, setInvoiceType] = useState<"GST_INVOICE" | "NON_GST_INVOICE">("GST_INVOICE");
  const [paymentType, setPaymentType] = useState<"CASH" | "UPI" | "CREDIT">("CASH");
  const [invoiceDiscount, setInvoiceDiscount] = useState(0);
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  useEffect(() => {
    fetch("/api/customers").then((r) => r.json()).then(setCustomers).catch(console.error);
    fetch("/api/products").then((r) => r.json()).then(setProducts).catch(console.error);
    fetch("/api/invoices/next-number")
      .then((r) => r.json())
      .then((d) => setInvoiceNumber(d.invoiceNumber))
      .catch(console.error);
  }, []);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.mobile.includes(customerSearch)
  );

  const filteredProducts = products.filter((p) => {
    const q = productSearch.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.marathiName?.includes(productSearch) ?? false)
    );
  });

  const addProduct = (product: Product) => {
    const existing = lineItems.find((i) => i.productId === product.id);
    if (existing) {
      setLineItems(
        lineItems.map((i) =>
          i.productId === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      );
    } else {
      setLineItems([
        ...lineItems,
        {
          productId: product.id,
          productName: product.marathiName
            ? `${product.marathiName} (${product.name})`
            : product.name,
          quantity: 1,
          rate: product.sellingRate,
          discountPercent: 0,
          discountAmount: 0,
          gstPercent: product.gstPercentage,
          stock: product.currentStock,
          unit: product.unit,
        },
      ]);
    }
    setProductSearch("");
    setShowProductDropdown(false);
  };

  const updateItem = (index: number, field: keyof LineItem, value: number | string) => {
    setLineItems(
      lineItems.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const removeItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const calculateTotals = useCallback(() => {
    let subtotal = 0;
    let gstTotal = 0;
    let itemDiscounts = 0;

    lineItems.forEach((item) => {
      const lineSub = item.quantity * item.rate;
      const disc =
        item.discountAmount || (lineSub * item.discountPercent) / 100;
      const taxable = lineSub - disc;
      const gst = gstEnabled && invoiceType === "GST_INVOICE"
        ? (taxable * item.gstPercent) / 100
        : 0;
      subtotal += lineSub;
      itemDiscounts += disc;
      gstTotal += gst;
    });

    const taxableAmount = subtotal - itemDiscounts - invoiceDiscount;
    const totalAmount = taxableAmount + gstTotal;

    return { subtotal, itemDiscounts, taxableAmount, gstTotal, totalAmount };
  }, [lineItems, invoiceDiscount, gstEnabled, invoiceType]);

  const totals = calculateTotals();

  const handleSubmit = async (asDraft = false) => {
    setError(null);
    setIsLoading(true);

    if (!selectedCustomer) {
      setError("Please select a customer");
      setIsLoading(false);
      return;
    }
    if (lineItems.length === 0) {
      setError("Add at least one product");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomer,
          invoiceDate: new Date().toISOString(),
          invoiceType: gstEnabled ? "GST_INVOICE" : "NON_GST_INVOICE",
          paymentType,
          gstEnabled: gstEnabled && invoiceType === "GST_INVOICE",
          discountAmount: invoiceDiscount,
          notes,
          status: asDraft ? "DRAFT" : "SENT",
          items: lineItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            rate: item.rate,
            discountPercent: item.discountPercent,
            discountAmount: item.discountAmount,
            gstPercent: item.gstPercent,
          })),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Failed to create invoice");
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push(`/dashboard/billing/${data.id}`), 1000);
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        handleSubmit(false);
      }
      if (e.ctrlKey && e.key === "p") {
        e.preventDefault();
        productSearchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/billing" className="text-gray-600 hover:text-brand-emerald">
            <ChevronLeft size={28} />
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-brand-charcoal">New Invoice</h1>
            <p className="text-brand-muted text-sm">{invoiceNumber}</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs text-brand-muted">
          <Keyboard size={14} />
          Ctrl+S Save | Ctrl+P Add Product
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex gap-3">
          <AlertCircle className="text-red-600 shrink-0" size={20} />
          <p className="text-red-700">{error}</p>
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex gap-3">
          <CheckCircle className="text-green-600 shrink-0" size={20} />
          <p className="text-green-700">Invoice created! Redirecting...</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-brand-gold/20 p-6">
            <h2 className="font-semibold text-brand-emerald mb-4">Customer</h2>
            <input
              type="text"
              placeholder="Search customer by name or mobile..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              className="w-full px-4 py-3 text-lg border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-emerald outline-none mb-3"
            />
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="w-full px-4 py-3 text-lg border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-emerald outline-none"
            >
              <option value="">Select Customer</option>
              {filteredCustomers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.mobile}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-brand-gold/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-brand-emerald">Products</h2>
              <span className="text-sm text-brand-muted">{lineItems.length} items</span>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-4 text-gray-400" size={20} />
              <input
                ref={productSearchRef}
                type="text"
                placeholder="Search product (Ctrl+P)..."
                value={productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  setShowProductDropdown(true);
                }}
                onFocus={() => setShowProductDropdown(true)}
                className="w-full pl-10 pr-4 py-3 text-lg border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-emerald outline-none"
              />
              {showProductDropdown && productSearch && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                  {filteredProducts.slice(0, 8).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => addProduct(p)}
                      className="w-full text-left px-4 py-3 hover:bg-brand-cream border-b last:border-0"
                    >
                      <span className="font-medium">
                        {p.marathiName || p.name}
                      </span>
                      <span className="text-sm text-brand-muted ml-2">
                        Stock: {p.currentStock} {p.unit} | ₹{p.sellingRate}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-brand-emerald text-white">
                    <th className="px-3 py-3 text-left rounded-tl-lg">Product</th>
                    <th className="px-3 py-3 text-left">Qty</th>
                    <th className="px-3 py-3 text-left">Rate</th>
                    <th className="px-3 py-3 text-left">Disc%</th>
                    <th className="px-3 py-3 text-left">GST%</th>
                    <th className="px-3 py-3 text-left">Total</th>
                    <th className="px-3 py-3 rounded-tr-lg"></th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, index) => {
                    const lineSub = item.quantity * item.rate;
                    const disc = (lineSub * item.discountPercent) / 100;
                    const taxable = lineSub - disc;
                    const gst =
                      gstEnabled && invoiceType === "GST_INVOICE"
                        ? (taxable * item.gstPercent) / 100
                        : 0;
                    const total = taxable + gst;

                    return (
                      <tr key={index} className="border-b hover:bg-brand-cream/50">
                        <td className="px-3 py-3">
                          <div className="font-medium">{item.productName}</div>
                          <div className="text-xs text-brand-muted">
                            Stock: {item.stock} {item.unit}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(index, "quantity", parseFloat(e.target.value) || 0)
                            }
                            className="w-20 px-2 py-2 border rounded-lg text-lg"
                            min={0}
                            step={0.1}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={item.rate}
                            onChange={(e) =>
                              updateItem(index, "rate", parseFloat(e.target.value) || 0)
                            }
                            className="w-24 px-2 py-2 border rounded-lg"
                            min={0}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={item.discountPercent}
                            onChange={(e) =>
                              updateItem(index, "discountPercent", parseFloat(e.target.value) || 0)
                            }
                            className="w-16 px-2 py-2 border rounded-lg"
                            min={0}
                          />
                        </td>
                        <td className="px-3 py-2 text-brand-muted">{item.gstPercent}%</td>
                        <td className="px-3 py-2 font-semibold">{formatCurrency(total)}</td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <X size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {lineItems.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-brand-muted">
                        Search and add products above
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-brand-gold/20 p-6 space-y-4">
            <h2 className="font-semibold text-brand-emerald">Invoice Settings</h2>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={gstEnabled}
                onChange={(e) => {
                  setGstEnabled(e.target.checked);
                  setInvoiceType(e.target.checked ? "GST_INVOICE" : "NON_GST_INVOICE");
                }}
                className="w-5 h-5 accent-brand-emerald"
              />
              <span className="font-medium">GST Enabled</span>
            </label>

            <div>
              <label className="block text-sm font-medium mb-2">Payment Type</label>
              <div className="grid grid-cols-3 gap-2">
                {(["CASH", "UPI", "CREDIT"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setPaymentType(type)}
                    className={`py-3 rounded-xl font-semibold text-sm transition ${
                      paymentType === type
                        ? "bg-brand-emerald text-white"
                        : "bg-brand-cream text-brand-charcoal hover:bg-brand-gold/20"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Invoice Discount (₹)</label>
              <input
                type="number"
                value={invoiceDiscount}
                onChange={(e) => setInvoiceDiscount(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-3 border rounded-xl text-lg"
                min={0}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full px-4 py-2 border rounded-xl"
                placeholder="Optional notes..."
              />
            </div>
          </div>

          <div className="bg-brand-emerald text-white rounded-2xl p-6 space-y-3">
            <div className="flex justify-between text-brand-cream/80">
              <span>Subtotal</span>
              <span>{formatCurrency(totals.subtotal)}</span>
            </div>
            {totals.itemDiscounts > 0 && (
              <div className="flex justify-between text-brand-cream/80">
                <span>Item Discounts</span>
                <span>-{formatCurrency(totals.itemDiscounts)}</span>
              </div>
            )}
            {invoiceDiscount > 0 && (
              <div className="flex justify-between text-brand-cream/80">
                <span>Invoice Discount</span>
                <span>-{formatCurrency(invoiceDiscount)}</span>
              </div>
            )}
            {gstEnabled && (
              <div className="flex justify-between text-brand-cream/80">
                <span>GST</span>
                <span>{formatCurrency(totals.gstTotal)}</span>
              </div>
            )}
            <div className="border-t border-brand-gold/40 pt-3 flex justify-between text-xl font-bold">
              <span>Grand Total</span>
              <span className="text-brand-gold">{formatCurrency(totals.totalAmount)}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={isLoading}
              className="w-full py-4 bg-brand-gold hover:bg-brand-gold/90 text-brand-charcoal font-bold text-lg rounded-2xl transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save size={22} />
              {isLoading ? "Saving..." : "Create Invoice"}
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={isLoading}
              className="w-full py-3 bg-white border-2 border-brand-emerald text-brand-emerald font-semibold rounded-2xl hover:bg-brand-cream transition"
            >
              Save as Draft
            </button>
            <Link
              href="/dashboard/billing"
              className="w-full py-3 text-center text-brand-muted hover:text-brand-charcoal"
            >
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
