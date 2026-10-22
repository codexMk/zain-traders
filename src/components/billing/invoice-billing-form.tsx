"use client";

import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, CheckCircle, ChevronLeft, Keyboard, Plus, Save, Search, Trash2 } from "lucide-react";
import { calculateInvoiceTotals, formatCurrency } from "@/lib/invoice-utils";
import { useSession } from "next-auth/react";

const STATES = [
  ["01", "Jammu and Kashmir"], ["02", "Himachal Pradesh"], ["03", "Punjab"], ["04", "Chandigarh"], ["05", "Uttarakhand"], ["06", "Haryana"], ["07", "Delhi"], ["08", "Rajasthan"], ["09", "Uttar Pradesh"], ["10", "Bihar"], ["11", "Sikkim"], ["12", "Arunachal Pradesh"], ["13", "Nagaland"], ["14", "Manipur"], ["15", "Mizoram"], ["16", "Tripura"], ["17", "Meghalaya"], ["18", "Assam"], ["19", "West Bengal"], ["20", "Jharkhand"], ["21", "Odisha"], ["22", "Chhattisgarh"], ["23", "Madhya Pradesh"], ["24", "Gujarat"], ["26", "Dadra and Nagar Haveli and Daman and Diu"], ["27", "Maharashtra"], ["28", "Andhra Pradesh"], ["29", "Karnataka"], ["30", "Goa"], ["31", "Lakshadweep"], ["32", "Kerala"], ["33", "Tamil Nadu"], ["34", "Puducherry"], ["35", "Andaman and Nicobar Islands"], ["36", "Telangana"], ["37", "Andhra Pradesh"], ["38", "Ladakh"],
] as const;

type Customer = {
  id: string; name: string; shopName?: string | null; mobile: string; address: string;
  gstNumber?: string | null; stateCode?: string | null; outstandingAmount: number;
  previousInvoiceDate?: string | null;
};
type Product = {
  id: string; name: string; marathiName?: string | null; sku: string; hsnCode?: string | null;
  sellingRate: number; lastSellingRate?: number | null; gstPercentage: number;
  currentStock: number; unit: string;
};
type Category = { id: string; name: string };
type LineItem = {
  key: string; productId: string | null; name: string; sku: string; hsnCode: string;
  quantity: number; unit: string; rate: number; discountAmount: number; gstPercent: number;
  stock: number | null; newProduct?: { sku: string; categoryId: string; purchaseRate: number; initialStock: number; minimumStockLevel: number };
};
type BusinessSettings = { gstin: string | null; registeredStateCode: string | null };

const todayIndia = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
const dateAtIndiaMidnight = (date: string) => new Date(`${date}T00:00:00+05:30`).toISOString();

export default function InvoiceBillingForm() {
  const router = useRouter();
  const { data: session } = useSession();
  const canOverrideRate = session?.user?.role === "OWNER";
  const canSaveProduct = session?.user?.role === "OWNER";
  const productSearchRef = useRef<HTMLInputElement>(null);
  const customerSearchRef = useRef<HTMLInputElement>(null);
  const saveKey = useRef("");
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [business, setBusiness] = useState<BusinessSettings | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [customerMode, setCustomerMode] = useState<"selected" | "inline" | "walkin">("walkin");
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerSuggestions, setCustomerSuggestions] = useState(false);
  const [customer, setCustomer] = useState({ name: "", shopName: "", mobile: "", address: "", gstNumber: "", stateCode: "", save: false });
  const [invoiceDate, setInvoiceDate] = useState(todayIndia());
  const [dueDate, setDueDate] = useState("");
  const [invoiceType, setInvoiceType] = useState<"GST_INVOICE" | "NON_GST_INVOICE">("GST_INVOICE");
  const [placeOfSupply, setPlaceOfSupply] = useState("");
  const [paymentType, setPaymentType] = useState<"CASH" | "UPI" | "CREDIT">("CASH");
  const [amountReceived, setAmountReceived] = useState(0);
  const [paymentReference, setPaymentReference] = useState("");
  const [invoiceDiscount, setInvoiceDiscount] = useState(0);
  const [notes, setNotes] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [productSuggestions, setProductSuggestions] = useState(false);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  useEffect(() => {
    saveKey.current = crypto.randomUUID();
    Promise.all([
      fetch("/api/customers").then((response) => response.ok ? response.json() : []),
      fetch("/api/products").then((response) => response.ok ? response.json() : []),
      fetch("/api/categories").then((response) => response.ok ? response.json() : []),
      fetch("/api/settings/business").then((response) => response.ok ? response.json() : null),
      fetch("/api/invoices/next-number").then((response) => response.ok ? response.json() : null),
    ]).then(([customerRows, productRows, categoryRows, businessSettings, number]) => {
      setCustomers(customerRows);
      setProducts(productRows);
      setCategories(categoryRows);
      setBusiness(businessSettings);
      setInvoiceNumber(number?.invoiceNumber ?? "Generated when saved");
      if (businessSettings?.registeredStateCode) setPlaceOfSupply(businessSettings.registeredStateCode);
    }).catch(() => setError("Could not load billing data. Refresh the page and try again."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let active = true;
    const query = customerSearch.trim();
    if (!query) {
      setCustomers((current) => current);
      return;
    }
    const timeout = setTimeout(() => {
      fetch(`/api/customers?search=${encodeURIComponent(query)}`)
        .then((response) => response.ok ? response.json() : [])
        .then((rows: Customer[]) => { if (active) setCustomers(rows); })
        .catch(() => undefined);
    }, 150);
    return () => { active = false; clearTimeout(timeout); };
  }, [customerSearch]);

  useEffect(() => {
    let active = true;
    const query = productSearch.trim();
    if (query.length < 2 && !customerId) {
      return;
    }
    const timeout = setTimeout(() => {
      const customerParam = customerId ? `&customerId=${encodeURIComponent(customerId)}` : "";
      fetch(`/api/products?${query.length >= 2 ? `search=${encodeURIComponent(query)}` : ""}${customerParam}`)
        .then((response) => response.ok ? response.json() : [])
        .then((rows: Product[]) => { if (active) setProducts(rows); })
        .catch(() => undefined);
    }, 150);
    return () => { active = false; clearTimeout(timeout); };
  }, [productSearch, customerId]);

  const totals = useMemo(() => {
    if (!lineItems.length) return { subtotal: 0, discountAmount: invoiceDiscount, taxableAmount: 0, gstAmount: 0, cgstAmount: 0, sgstAmount: 0, igstAmount: 0, totalAmount: 0, calculatedItems: [] };
    try {
      const crossState = !!placeOfSupply && !!business?.registeredStateCode && placeOfSupply !== business.registeredStateCode;
      return calculateInvoiceTotals(lineItems.map((item) => ({
        productId: item.productId,
        productName: item.name,
        productSku: item.sku || null,
        hsnCode: item.hsnCode || null,
        unit: item.unit,
        quantity: item.quantity,
        rate: item.rate,
        discountAmount: item.discountAmount,
        gstPercent: invoiceType === "GST_INVOICE" ? item.gstPercent : 0,
      })), invoiceDiscount, invoiceType === "GST_INVOICE", crossState ? "INTER_STATE" : "INTRA_STATE");
    } catch {
      return { subtotal: 0, discountAmount: invoiceDiscount, taxableAmount: 0, gstAmount: 0, cgstAmount: 0, sgstAmount: 0, igstAmount: 0, totalAmount: 0, calculatedItems: [] };
    }
  }, [lineItems, invoiceDiscount, invoiceType, placeOfSupply, business?.registeredStateCode]);

  const selectCustomer = (selected: Customer) => {
    setCustomerId(selected.id);
    setCustomerMode("selected");
    setCustomer({ name: selected.name, shopName: selected.shopName ?? "", mobile: selected.mobile, address: selected.address, gstNumber: selected.gstNumber ?? "", stateCode: selected.stateCode ?? "", save: false });
    setCustomerSearch(`${selected.shopName ? `${selected.shopName} · ` : ""}${selected.name} · ${selected.mobile}`);
    setPlaceOfSupply(selected.stateCode || business?.registeredStateCode || "");
    setCustomerSuggestions(false);
  };

  const updateCustomer = (field: keyof typeof customer, value: string | boolean) => setCustomer((current) => ({ ...current, [field]: value }));

  const addProduct = (product: Product) => {
    const exists = lineItems.find((item) => item.productId === product.id);
    if (exists) {
      setLineItems((items) => items.map((item) => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item));
      window.setTimeout(() => document.getElementById(`quantity-${exists.key}`)?.focus(), 0);
    } else {
      const key = crypto.randomUUID();
      setLineItems((items) => [...items, {
        key, productId: product.id,
        name: product.marathiName ? `${product.marathiName} (${product.name})` : product.name,
        sku: product.sku, hsnCode: product.hsnCode ?? "", quantity: 1, unit: product.unit,
        rate: product.lastSellingRate ?? product.sellingRate, discountAmount: 0,
        gstPercent: product.gstPercentage, stock: product.currentStock,
      }]);
      window.setTimeout(() => document.getElementById(`quantity-${key}`)?.focus(), 0);
    }
    setProductSearch("");
    setProductSuggestions(false);
    productSearchRef.current?.focus();
  };

  const addOneTimeItem = () => {
    const key = crypto.randomUUID();
    setLineItems((items) => [...items, { key, productId: null, name: productSearch.trim(), sku: "", hsnCode: "", quantity: 1, unit: "PIECE", rate: 0, discountAmount: 0, gstPercent: 0, stock: null }]);
    window.setTimeout(() => document.getElementById(`quantity-${key}`)?.focus(), 0);
    setProductSearch("");
    setProductSuggestions(false);
  };

  const updateLine = (key: string, values: Partial<LineItem>) => setLineItems((items) => items.map((item) => item.key === key ? { ...item, ...values } : item));
  const removeLine = (key: string) => setLineItems((items) => items.filter((item) => item.key !== key));

  const submit = async (event: FormEvent | null, mode: "draft" | "save" | "print") => {
    event?.preventDefault();
    if (isSaving) return;
    setError("");
    setSuccess("");
    if (!lineItems.length) { setError("Add at least one item"); return; }
    if (customerMode === "inline" && !customer.name.trim()) { setError("Enter the customer name or choose Walk-in"); return; }
    if (customerMode === "inline" && customer.save && !customer.mobile.trim()) { setError("A mobile number is required to save a customer"); return; }
    if (invoiceType === "GST_INVOICE" && (!business?.gstin || !business.registeredStateCode)) { setError("Set your supplier GSTIN and registered state in Settings to issue GST invoices"); return; }
    if (invoiceType === "GST_INVOICE" && !placeOfSupply) { setError("Select the place of supply for this GST invoice"); return; }
    if (amountReceived > totals.totalAmount) { setError("Amount received cannot exceed the invoice total"); return; }
    for (const item of lineItems) {
      if (!item.name.trim()) { setError("Enter a description for every item"); return; }
      if (item.quantity <= 0 || item.rate < 0 || item.discountAmount < 0) { setError("Check each item's quantity, rate and discount"); return; }
      if (item.stock !== null && mode !== "draft" && item.quantity > item.stock) { setError(`Insufficient stock for ${item.name}. Available: ${item.stock} ${item.unit}`); return; }
      if (item.newProduct && item.quantity > item.newProduct.initialStock) { setError(`Initial stock for ${item.name} must cover the invoice quantity`); return; }
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          customer: customerMode === "inline" ? { ...customer, save: customer.save } : undefined,
          invoiceDate: dateAtIndiaMidnight(invoiceDate),
          dueDate: dueDate ? dateAtIndiaMidnight(dueDate) : null,
          invoiceType,
          placeOfSupplyStateCode: invoiceType === "GST_INVOICE" ? placeOfSupply : null,
          paymentType,
          amountReceived: mode === "draft" ? 0 : amountReceived,
          paymentDate: dateAtIndiaMidnight(invoiceDate),
          paymentReference: paymentReference || undefined,
          discountAmount: invoiceDiscount,
          notes,
          status: mode === "draft" ? "DRAFT" : "SENT",
          idempotencyKey: saveKey.current,
          items: lineItems.map((item) => ({
            productId: item.productId,
            name: item.name,
            sku: item.sku || undefined,
            hsnCode: item.hsnCode || undefined,
            unit: item.unit,
            quantity: item.quantity,
            rate: item.rate,
            discountAmount: item.discountAmount,
            gstPercent: item.gstPercent,
            newProduct: item.newProduct,
          })),
        }),
      });
      const result = await response.json();
      if (!response.ok) { setError(result.error || "Could not save invoice"); return; }
      setSuccess(mode === "draft" ? "Draft saved" : "Invoice saved");
      const query = mode === "print" ? "?print=A4" : "";
      router.push(`/dashboard/billing/${result.id}${query}`);
    } catch {
      setError("The invoice could not be saved. The same save key will prevent a duplicate if you retry.");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const handler = (event: globalThis.KeyboardEvent) => {
      if (event.ctrlKey && event.key.toLowerCase() === "s") { event.preventDefault(); void submit(null, "save"); }
      if (event.ctrlKey && event.key.toLowerCase() === "p") { event.preventDefault(); productSearchRef.current?.focus(); }
      if (event.key === "Escape") { setProductSuggestions(false); setCustomerSuggestions(false); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const suggestions = products.filter((product) => {
    const query = productSearch.toLowerCase();
    return !query || product.name.toLowerCase().includes(query) || product.sku.toLowerCase().includes(query) || (product.marathiName ?? "").includes(productSearch);
  }).slice(0, 10);
  const matchingCustomers = customers.filter((row) => {
    const query = customerSearch.toLowerCase();
    return row.name.toLowerCase().includes(query) || (row.shopName ?? "").toLowerCase().includes(query) || row.mobile.includes(customerSearch);
  }).slice(0, 10);

  return (
    <form onSubmit={(event) => void submit(event, "save")} className="mx-auto max-w-7xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3"><Link href="/dashboard/billing" className="text-brand-muted"><ChevronLeft size={26} /></Link><div><h1 className="text-2xl font-bold text-brand-charcoal">New Bill</h1><p className="text-sm text-brand-muted">Invoice {invoiceNumber || "…"}</p></div></div>
        <div className="hidden items-center gap-2 text-xs text-brand-muted md:flex"><Keyboard size={15} /> Ctrl+S Save · Ctrl+P Product · Tab to move</div>
      </div>

      {error && <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800"><AlertCircle size={20} className="mt-0.5 shrink-0" />{error}</div>}
      {success && <div role="status" className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-green-800"><CheckCircle size={20} />{success}</div>}
      {loading && <div className="rounded-xl bg-white p-4 text-sm text-brand-muted">Loading customers, products and invoice setup…</div>}

      <section className="grid gap-4 rounded-2xl border border-brand-gold/20 bg-white p-5 shadow-sm lg:grid-cols-3">
        <div className="relative lg:col-span-2">
          <label className="mb-2 block text-sm font-semibold">Customer</label>
          <div className="relative"><Search className="absolute left-3 top-3.5 text-gray-400" size={18} /><input ref={customerSearchRef} value={customerSearch} onChange={(event) => { setCustomerSearch(event.target.value); setCustomerId(null); setCustomerMode("inline"); setCustomer((current) => ({ ...current, name: event.target.value })); setCustomerSuggestions(true); }} onKeyDown={(event) => { if (event.key === "Enter" && customerSuggestions && customerSearch.trim() && matchingCustomers[0]) { event.preventDefault(); selectCustomer(matchingCustomers[0]); } if (event.key === "ArrowDown") { event.preventDefault(); document.querySelector<HTMLButtonElement>("#customer-suggestions button")?.focus(); } }} onFocus={() => setCustomerSuggestions(true)} placeholder="Search customer, shop or mobile…" className="w-full rounded-xl border py-3 pl-10 pr-3 outline-none focus:ring-2 focus:ring-brand-emerald" autoComplete="off" /></div>
          <div className="mt-2 flex gap-3 text-xs"><button type="button" onClick={() => { setCustomerId(null); setCustomerMode("walkin"); setCustomer({ name: "", shopName: "", mobile: "", address: "", gstNumber: "", stateCode: "", save: false }); setCustomerSearch("Walk-in customer"); setCustomerSuggestions(false); }} className="font-semibold text-brand-emerald">Use walk-in customer</button><button type="button" onClick={() => { setCustomerId(null); setCustomerMode("inline"); setCustomerSearch(""); setCustomer({ name: "", shopName: "", mobile: "", address: "", gstNumber: "", stateCode: "", save: false }); setCustomerSuggestions(false); }} className="font-semibold text-brand-emerald">Enter customer inline</button></div>
          {customerSuggestions && customerMode !== "selected" && <div id="customer-suggestions" className="absolute z-30 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border bg-white shadow-xl">
            {!customerSearch.trim() && <p className="px-4 py-2 text-xs font-semibold uppercase text-brand-muted">Recent customers</p>}
            {matchingCustomers.length === 0 && <p className="px-4 py-3 text-sm text-brand-muted">No matching customer records</p>}
            {matchingCustomers.map((row) => <button type="button" key={row.id} onClick={() => selectCustomer(row)} className="flex w-full items-start justify-between gap-4 border-b px-4 py-3 text-left last:border-0 hover:bg-brand-cream"><span><span className="block font-semibold">{row.shopName ? `${row.shopName} · ` : ""}{row.name}</span><span className="text-sm text-brand-muted">{row.mobile} · {row.previousInvoiceDate ? `Last bill ${new Date(row.previousInvoiceDate).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}` : "No previous bill"}</span></span><span className="text-right text-xs text-brand-muted">Due<br /><b>{formatCurrency(row.outstandingAmount || 0)}</b></span></button>)}
            <button type="button" onClick={() => { setCustomerMode("inline"); setCustomerId(null); setCustomer((current) => ({ ...current, name: customerSearch.trim(), save: true })); setCustomerSuggestions(false); }} className="flex w-full items-center gap-2 px-4 py-3 text-left font-semibold text-brand-emerald hover:bg-brand-cream"><Plus size={17} /> Enter new customer inline</button>
            <button type="button" onClick={() => { setCustomerId(null); setCustomerMode("walkin"); setCustomer({ name: "", shopName: "", mobile: "", address: "", gstNumber: "", stateCode: "", save: false }); setCustomerSearch("Walk-in customer"); setCustomerSuggestions(false); }} className="w-full px-4 py-3 text-left text-sm text-brand-muted hover:bg-brand-cream">Use walk-in customer</button>
          </div>}
          {customerMode === "selected" && <p className="mt-1 text-xs text-brand-muted">Customer details copied to this invoice. Saved customer details will not change.</p>}
          {customerMode === "inline" && <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <input value={customer.name} onChange={(e) => updateCustomer("name", e.target.value)} placeholder="Customer name *" className="rounded-lg border px-3 py-2" />
            <input value={customer.shopName} onChange={(e) => updateCustomer("shopName", e.target.value)} placeholder="Shop name (optional)" className="rounded-lg border px-3 py-2" />
            <input value={customer.mobile} onChange={(e) => updateCustomer("mobile", e.target.value)} placeholder="Mobile number" className="rounded-lg border px-3 py-2" />
            <input value={customer.gstNumber} onChange={(e) => updateCustomer("gstNumber", e.target.value.toUpperCase())} placeholder="Customer GSTIN" className="rounded-lg border px-3 py-2 uppercase" />
            <input value={customer.address} onChange={(e) => updateCustomer("address", e.target.value)} placeholder="Billing address" className="rounded-lg border px-3 py-2 sm:col-span-2" />
            <select value={customer.stateCode} onChange={(e) => { updateCustomer("stateCode", e.target.value); setPlaceOfSupply(e.target.value); }} className="rounded-lg border bg-white px-3 py-2"><option value="">Customer state (optional)</option>{STATES.map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={customer.save} onChange={(e) => updateCustomer("save", e.target.checked)} /> Save customer for future bills</label>
          </div>}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <label className="text-sm font-semibold">Invoice date<input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2 font-normal" /></label>
          <label className="text-sm font-semibold">Due date (optional)<input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2 font-normal" /></label>
          <fieldset className="sm:col-span-2 lg:col-span-1"><legend className="mb-1 text-sm font-semibold">Bill type</legend><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setInvoiceType("GST_INVOICE")} className={`rounded-lg px-3 py-2 text-sm font-semibold ${invoiceType === "GST_INVOICE" ? "bg-brand-emerald text-white" : "bg-brand-cream"}`}>GST</button><button type="button" onClick={() => setInvoiceType("NON_GST_INVOICE")} className={`rounded-lg px-3 py-2 text-sm font-semibold ${invoiceType === "NON_GST_INVOICE" ? "bg-brand-emerald text-white" : "bg-brand-cream"}`}>Non-GST</button></div></fieldset>
          {invoiceType === "GST_INVOICE" && <label className="text-sm font-semibold sm:col-span-2 lg:col-span-1">Place of supply<select value={placeOfSupply} onChange={(e) => setPlaceOfSupply(e.target.value)} className="mt-1 w-full rounded-lg border bg-white px-3 py-2 font-normal"><option value="">Select state</option>{STATES.map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select></label>}
        </div>
      </section>

      {invoiceType === "GST_INVOICE" && (!business?.gstin || !business.registeredStateCode) && <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">Supplier GSTIN and registered state are required before a GST invoice can be finalized. <Link className="font-semibold underline" href="/dashboard/settings">Open Settings</Link></div>}

      <section className="rounded-2xl border border-brand-gold/20 bg-white p-5 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold text-brand-emerald">Items</h2><span className="text-sm text-brand-muted">{lineItems.length} line{lineItems.length === 1 ? "" : "s"}</span></div>
        <div className="relative mb-4 flex gap-2">
          <div className="relative flex-1"><Search className="absolute left-3 top-3.5 text-gray-400" size={18} /><input ref={productSearchRef} value={productSearch} onChange={(e) => { setProductSearch(e.target.value); setProductSuggestions(true); }} onFocus={() => setProductSuggestions(true)} onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter" && suggestions.length === 1) { e.preventDefault(); addProduct(suggestions[0]); } if (e.key === "ArrowDown") { e.preventDefault(); document.querySelector<HTMLButtonElement>("#product-suggestions button")?.focus(); } }} placeholder="Search product name, SKU or code…" className="w-full rounded-xl border py-3 pl-10 pr-3 outline-none focus:ring-2 focus:ring-brand-emerald" autoComplete="off" /></div>
          <button type="button" onClick={addOneTimeItem} disabled={!productSearch.trim()} className="rounded-xl border px-3 py-2 text-sm font-semibold text-brand-emerald disabled:opacity-40"><Plus size={17} className="mr-1 inline" />One-time item</button>
          {productSuggestions && <div id="product-suggestions" className="absolute left-0 right-28 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-xl border bg-white shadow-xl">
            {suggestions.map((product) => <button type="button" key={product.id} onClick={() => addProduct(product)} className="flex w-full items-center justify-between gap-3 border-b px-4 py-3 text-left last:border-0 hover:bg-brand-cream"><span><span className="block font-semibold">{product.marathiName || product.name}</span><span className="text-xs text-brand-muted">{product.sku} · {product.unit} · Stock {product.currentStock}</span></span><span className="text-right text-xs"><b>{formatCurrency(product.lastSellingRate ?? product.sellingRate)}</b><span className="block text-brand-muted">{product.lastSellingRate ? "Last customer rate" : "List price"}</span></span></button>)}
            {productSearch.length >= 2 && <button type="button" onClick={addOneTimeItem} className="w-full px-4 py-3 text-left font-semibold text-brand-emerald hover:bg-brand-cream"><Plus size={16} className="mr-2 inline" />Add “{productSearch}” as one-time item</button>}
          </div>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-sm">
            <thead className="bg-brand-cream text-left"><tr><th className="px-3 py-2">Description / stock</th><th className="px-2 py-2">Qty</th><th className="px-2 py-2">Unit</th><th className="px-2 py-2">Rate</th><th className="px-2 py-2">Discount</th>{invoiceType === "GST_INVOICE" && <th className="px-2 py-2">GST</th>}<th className="px-2 py-2 text-right">Line total</th><th className="px-2 py-2">HSN / action</th></tr></thead>
            <tbody>{lineItems.map((item, index) => {
              const line = totals.calculatedItems[index];
              const amount = line?.amount ?? Math.max(0, item.quantity * item.rate - item.discountAmount);
              return <tr key={item.key} className="border-b align-top">
                <td className="px-3 py-3"><input value={item.name} onChange={(e) => updateLine(item.key, { name: e.target.value })} readOnly={!!item.productId} className="w-full min-w-44 rounded border px-2 py-1 font-medium read-only:border-transparent read-only:bg-transparent read-only:px-0" />{item.stock !== null && <p className="mt-1 text-xs text-brand-muted">Available: {item.stock} {item.unit}</p>}{!item.productId && canSaveProduct && <details className="mt-2"><summary className="cursor-pointer text-xs font-semibold text-brand-emerald">Save to catalogue</summary><div className="mt-2 grid max-w-xl grid-cols-2 gap-2"><input placeholder="SKU / product code" value={item.newProduct?.sku ?? item.sku} onChange={(e) => updateLine(item.key, { sku: e.target.value, newProduct: { sku: e.target.value, categoryId: item.newProduct?.categoryId ?? "", purchaseRate: item.newProduct?.purchaseRate ?? 0, initialStock: item.newProduct?.initialStock ?? 0, minimumStockLevel: item.newProduct?.minimumStockLevel ?? 0 } })} className="rounded border px-2 py-1" /><select value={item.newProduct?.categoryId ?? ""} onChange={(e) => updateLine(item.key, { newProduct: { sku: item.newProduct?.sku ?? item.sku, categoryId: e.target.value, purchaseRate: item.newProduct?.purchaseRate ?? 0, initialStock: item.newProduct?.initialStock ?? 0, minimumStockLevel: item.newProduct?.minimumStockLevel ?? 0 } })} className="rounded border bg-white px-2 py-1"><option value="">Category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select><input type="number" min="0" step="0.01" placeholder="Purchase rate" value={item.newProduct?.purchaseRate ?? ""} onChange={(e) => updateLine(item.key, { newProduct: { sku: item.newProduct?.sku ?? item.sku, categoryId: item.newProduct?.categoryId ?? "", purchaseRate: Number(e.target.value), initialStock: item.newProduct?.initialStock ?? 0, minimumStockLevel: item.newProduct?.minimumStockLevel ?? 0 } })} className="rounded border px-2 py-1" /><input type="number" min="0" step="0.01" placeholder="Initial stock" value={item.newProduct?.initialStock ?? ""} onChange={(e) => updateLine(item.key, { newProduct: { sku: item.newProduct?.sku ?? item.sku, categoryId: item.newProduct?.categoryId ?? "", purchaseRate: item.newProduct?.purchaseRate ?? 0, initialStock: Number(e.target.value), minimumStockLevel: item.newProduct?.minimumStockLevel ?? 0 } })} className="rounded border px-2 py-1" /><input type="number" min="0" step="0.01" placeholder="Minimum stock" value={item.newProduct?.minimumStockLevel ?? ""} onChange={(e) => updateLine(item.key, { newProduct: { sku: item.newProduct?.sku ?? item.sku, categoryId: item.newProduct?.categoryId ?? "", purchaseRate: item.newProduct?.purchaseRate ?? 0, initialStock: item.newProduct?.initialStock ?? 0, minimumStockLevel: Number(e.target.value) } })} className="rounded border px-2 py-1" /></div></details>}</td>
                <td className="px-2 py-3"><input id={`quantity-${item.key}`} aria-label={`${item.name} quantity`} type="number" min="0.001" step="0.001" value={item.quantity} onChange={(e) => updateLine(item.key, { quantity: Number(e.target.value) })} className="w-20 rounded border px-2 py-1.5" /></td>
                <td className="px-2 py-3">{item.productId ? item.unit : <select aria-label={`${item.name} unit`} value={item.unit} onChange={(e) => updateLine(item.key, { unit: e.target.value })} className="w-24 rounded border bg-white px-2 py-1.5">{["KG", "GRAM", "BAG", "PIECE"].map((unit) => <option key={unit}>{unit}</option>)}</select>}</td>
                <td className="px-2 py-3"><input aria-label={`${item.name} rate`} type="number" min="0" step="0.01" value={item.rate} readOnly={!canOverrideRate && !!item.productId} onChange={(e) => updateLine(item.key, { rate: Number(e.target.value) })} className="w-24 rounded border px-2 py-1.5 read-only:border-transparent read-only:bg-transparent" /></td>
                <td className="px-2 py-3"><input aria-label={`${item.name} discount`} type="number" min="0" step="0.01" value={item.discountAmount} onChange={(e) => updateLine(item.key, { discountAmount: Number(e.target.value) })} className="w-20 rounded border px-2 py-1.5" /></td>
                {invoiceType === "GST_INVOICE" && <td className="px-2 py-3">{item.productId ? `${item.gstPercent}%` : canOverrideRate ? <input aria-label={`${item.name} GST rate`} type="number" min="0" max="100" step="0.01" value={item.gstPercent} onChange={(e) => updateLine(item.key, { gstPercent: Number(e.target.value) })} className="w-16 rounded border px-1 py-1" /> : "Owner sets"}</td>}
                <td className="px-2 py-3 text-right font-semibold">{formatCurrency(amount)}</td>
                <td className="px-2 py-3"><button type="button" onClick={() => removeLine(item.key)} className="rounded p-1 text-red-600" aria-label={`Remove ${item.name}`}><Trash2 size={17} /></button>{!item.productId && <input aria-label={`${item.name} HSN or SAC`} value={item.hsnCode} onChange={(e) => updateLine(item.key, { hsnCode: e.target.value })} placeholder="HSN / SAC" className="mt-1 w-20 rounded border px-1 py-1 text-xs" />}</td>
              </tr>;
            })}{lineItems.length === 0 && <tr><td colSpan={invoiceType === "GST_INVOICE" ? 8 : 7} className="py-12 text-center text-brand-muted">Search a product or add a one-time item</td></tr>}</tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 rounded-2xl border border-brand-gold/20 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="font-semibold text-brand-emerald">Payment and notes</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-sm font-semibold">Amount received<input type="number" min="0" step="0.01" value={amountReceived} onChange={(e) => setAmountReceived(Number(e.target.value))} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
            <label className="text-sm font-semibold">Payment mode<select value={paymentType === "CREDIT" ? "CASH" : paymentType} onChange={(e) => setPaymentType(e.target.value as "CASH" | "UPI")} disabled={amountReceived === 0} className="mt-1 w-full rounded-lg border bg-white px-3 py-2 disabled:opacity-50"><option value="CASH">Cash</option><option value="UPI">UPI</option></select></label>
            <label className="text-sm font-semibold">Reference (optional)<input value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
          </div>
          <label className="block text-sm font-semibold">Notes<textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="mt-1 w-full rounded-lg border px-3 py-2 font-normal" /></label>
        </div>
        <div className="space-y-3 rounded-2xl bg-brand-emerald p-5 text-white">
          <label className="block text-sm font-medium text-white/80">Invoice discount<input type="number" min="0" step="0.01" value={invoiceDiscount} onChange={(e) => setInvoiceDiscount(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-white/20 bg-white px-3 py-2 text-brand-charcoal" /></label>
          <div className="flex justify-between text-sm text-white/80"><span>Subtotal</span><span>{formatCurrency(totals.subtotal)}</span></div>
          {totals.discountAmount > 0 && <div className="flex justify-between text-sm text-white/80"><span>Discount</span><span>−{formatCurrency(totals.discountAmount)}</span></div>}
          <div className="flex justify-between text-sm text-white/80"><span>Taxable value</span><span>{formatCurrency(totals.taxableAmount)}</span></div>
          {invoiceType === "GST_INVOICE" && <div className="flex justify-between text-sm text-white/80"><span>{placeOfSupply && business?.registeredStateCode && placeOfSupply !== business.registeredStateCode ? "IGST" : "CGST + SGST"}</span><span>{formatCurrency(totals.gstAmount)}</span></div>}
          <div className="flex justify-between border-t border-white/20 pt-3 text-xl font-bold"><span>Grand total</span><span className="text-brand-gold">{formatCurrency(totals.totalAmount)}</span></div>
          <div className="flex justify-between text-sm text-white/80"><span>Received</span><span>{formatCurrency(amountReceived)}</span></div>
          <div className="flex justify-between text-base font-semibold"><span>Balance due</span><span>{formatCurrency(Math.max(0, totals.totalAmount - amountReceived))}</span></div>
        </div>
      </section>

      <div className="sticky bottom-0 z-10 flex flex-wrap justify-end gap-2 border-t bg-white/95 p-3 backdrop-blur print:hidden">
        <button type="button" onClick={(event) => void submit(event, "draft")} disabled={isSaving} className="rounded-xl border px-4 py-3 font-semibold disabled:opacity-50">{isSaving ? "Saving…" : "Save Draft"}</button>
        <button type="submit" disabled={isSaving} className="flex items-center gap-2 rounded-xl bg-brand-emerald px-5 py-3 font-bold text-white disabled:opacity-50"><Save size={18} />{isSaving ? "Saving…" : "Save Bill"}</button>
        <button type="button" onClick={(event) => void submit(event, "print")} disabled={isSaving} className="rounded-xl bg-brand-gold px-5 py-3 font-bold text-brand-charcoal disabled:opacity-50">Save and Print</button>
      </div>
    </form>
  );
}
