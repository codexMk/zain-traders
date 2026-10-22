"use client";

import { Bell, Building2, ShieldCheck, SlidersHorizontal, Sparkles } from "lucide-react";
import { useSession } from "next-auth/react";
import { FormEvent, useEffect, useState } from "react";
import { businessInfo } from "@/lib/business-info";

const settingsSections = [
  {
    title: "Business profile",
    icon: Building2,
    items: [
      { label: "Business name", value: "Zain Traders" },
      { label: "Location", value: "Head Office: Mallik Nagar, Kondhwa, Pune 411048 • Branch Office: Paranda, Dharashiv 413502" },
      { label: "Primary contact", value: "+91 90212 76946" },
    ],
  },
  {
    title: "Security & access",
    icon: ShieldCheck,
    items: [
      { label: "Owner access", value: "Enabled" },
      { label: "Two-factor prompt", value: "Recommended" },
      { label: "Password policy", value: "Strong" },
    ],
  },
  {
    title: "Notifications",
    icon: Bell,
    items: [
      { label: "Low stock alerts", value: "Enabled" },
      { label: "Invoice reminders", value: "Enabled" },
      { label: "Monthly review", value: "Scheduled" },
    ],
  },
  {
    title: "Workflow preferences",
    icon: SlidersHorizontal,
    items: [
      { label: "Auto stock updates", value: "On" },
      { label: "GST invoice defaults", value: "GST enabled" },
      { label: "Trade pricing view", value: "Standard" },
    ],
  },
];

export default function SettingsPage() {
  const { data: session } = useSession();
  const role = session?.user?.role ?? "OWNER";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-charcoal">Settings</h1>
          <p className="text-brand-muted mt-1">System controls and operational preferences</p>
        </div>
        <div className="rounded-full border border-brand-gold/40 bg-brand-gold/10 px-3 py-1.5 text-sm font-medium text-brand-charcoal">
          {role} access
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5">
          <BusinessInvoiceSettings canEdit={role === "OWNER"} />
          {settingsSections.map(({ title, icon: Icon, items }) => (
            <div key={title} className="rounded-2xl border border-brand-emerald/10 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <div className="rounded-xl bg-brand-cream p-2 text-brand-emerald">
                  <Icon size={18} />
                </div>
                <h2 className="text-lg font-semibold text-brand-charcoal">{title}</h2>
              </div>

              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-xl border border-brand-emerald/10 bg-brand-cream/30 px-3 py-2.5">
                    <span className="text-sm text-brand-muted">{item.label}</span>
                    <span className="text-sm font-semibold text-brand-charcoal">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border border-brand-emerald/10 bg-brand-emerald p-5 text-white shadow-sm">
            <div className="flex items-center gap-2">
              <Sparkles size={18} />
              <h2 className="text-lg font-semibold">System status</h2>
            </div>

            <div className="mt-5 space-y-4 text-sm text-white/80">
              <div className="flex items-center justify-between">
                <span>Database</span>
                <span className="font-semibold text-white">Connected</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Inventory sync</span>
                <span className="font-semibold text-white">Live</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Last backup</span>
                <span className="font-semibold text-white">Today, 08:30</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-brand-emerald/10 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-brand-charcoal">Quick actions</h2>
            <div className="mt-4 space-y-3">
              <button className="w-full rounded-xl bg-brand-gold px-4 py-2.5 text-sm font-semibold text-brand-charcoal hover:opacity-90">
                Download backup
              </button>
              <button className="w-full rounded-xl border border-brand-emerald/15 bg-brand-cream px-4 py-2.5 text-sm font-semibold text-brand-charcoal hover:bg-brand-cream/80">
                Reset low-stock rules
              </button>
              <button className="w-full rounded-xl border border-brand-emerald/15 bg-white px-4 py-2.5 text-sm font-semibold text-brand-charcoal hover:bg-brand-cream/40">
                Review user permissions
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const indianStates = [
  ["01", "Jammu and Kashmir"], ["02", "Himachal Pradesh"], ["03", "Punjab"], ["04", "Chandigarh"],
  ["05", "Uttarakhand"], ["06", "Haryana"], ["07", "Delhi"], ["08", "Rajasthan"], ["09", "Uttar Pradesh"],
  ["10", "Bihar"], ["11", "Sikkim"], ["12", "Arunachal Pradesh"], ["13", "Nagaland"], ["14", "Manipur"],
  ["15", "Mizoram"], ["16", "Tripura"], ["17", "Meghalaya"], ["18", "Assam"], ["19", "West Bengal"],
  ["20", "Jharkhand"], ["21", "Odisha"], ["22", "Chhattisgarh"], ["23", "Madhya Pradesh"], ["24", "Gujarat"],
  ["26", "Dadra and Nagar Haveli and Daman and Diu"], ["27", "Maharashtra"], ["28", "Andhra Pradesh"],
  ["29", "Karnataka"], ["30", "Goa"], ["31", "Lakshadweep"], ["32", "Kerala"], ["33", "Tamil Nadu"],
  ["34", "Puducherry"], ["35", "Andaman and Nicobar Islands"], ["36", "Telangana"], ["37", "Andhra Pradesh"],
  ["38", "Ladakh"],
] as const;

function BusinessInvoiceSettings({ canEdit }: { canEdit: boolean }) {
  const [legalName, setLegalName] = useState<string>(businessInfo.nameEnglish);
  const [address, setAddress] = useState<string>(businessInfo.address);
  const [phonesText, setPhonesText] = useState(businessInfo.phones.join("\n"));
  const [gstin, setGstin] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings/business")
      .then((response) => response.json())
      .then((data) => {
        setLegalName(data.legalName ?? businessInfo.nameEnglish);
        setAddress(data.address ?? businessInfo.address);
        setPhonesText((data.phoneNumbers ?? businessInfo.phones).join("\n"));
        setGstin(data.gstin ?? "");
        setStateCode(data.registeredStateCode ?? "");
      })
      .catch(() => setMessage("Business tax configuration could not be loaded"))
      .finally(() => setLoading(false));
  }, []);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    const response = await fetch("/api/settings/business", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ legalName, address, phoneNumbers: phonesText.split("\n").map((phone) => phone.trim()).filter(Boolean), gstin: gstin || null, registeredStateCode: stateCode || null }),
    });
    const result = await response.json();
    setMessage(response.ok ? "Invoice details saved" : result.error || "Could not save settings");
  };

  return (
    <form onSubmit={save} className="rounded-2xl border border-brand-emerald/10 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-brand-charcoal">Invoice business details</h2>
      <p className="mb-4 mt-1 text-sm text-brand-muted">GST invoices require your registered GSTIN and state. These details are saved on each new invoice.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium">Legal business name<input required value={legalName} onChange={(e) => setLegalName(e.target.value)} disabled={!canEdit || loading} className="mt-1 w-full rounded-xl border px-3 py-2" /></label>
        <label className="text-sm font-medium">Registered state<select value={stateCode} onChange={(e) => setStateCode(e.target.value)} disabled={!canEdit || loading} className="mt-1 w-full rounded-xl border bg-white px-3 py-2"><option value="">Select state</option>{indianStates.map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select></label>
        <label className="text-sm font-medium sm:col-span-2">Supplier address<textarea required value={address} onChange={(e) => setAddress(e.target.value)} disabled={!canEdit || loading} rows={2} className="mt-1 w-full rounded-xl border px-3 py-2" /></label>
        <label className="text-sm font-medium">Supplier GSTIN<input value={gstin} onChange={(e) => setGstin(e.target.value.toUpperCase())} disabled={!canEdit || loading} maxLength={15} className="mt-1 w-full rounded-xl border px-3 py-2 uppercase" placeholder="15-character GSTIN" /></label>
        <label className="text-sm font-medium">Contact numbers<textarea value={phonesText} onChange={(e) => setPhonesText(e.target.value)} disabled={!canEdit || loading} rows={2} className="mt-1 w-full rounded-xl border px-3 py-2" /></label>
      </div>
      <div className="mt-4 flex items-center gap-3">
        {canEdit && <button disabled={loading} className="rounded-xl bg-brand-emerald px-4 py-2 font-semibold text-white disabled:opacity-50">Save invoice details</button>}
        <span role="status" className="text-sm text-brand-muted">{loading ? "Loading…" : message}</span>
      </div>
    </form>
  );
}
