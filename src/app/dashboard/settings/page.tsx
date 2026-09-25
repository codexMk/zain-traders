"use client";

import { Bell, Building2, ShieldCheck, SlidersHorizontal, Sparkles } from "lucide-react";
import { useSession } from "next-auth/react";

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
