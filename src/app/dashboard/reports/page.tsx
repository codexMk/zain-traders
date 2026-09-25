import ReportsPanel from "@/components/reports/reports-panel";

export const metadata = {
  title: "Reports - Zain Traders",
};

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-brand-charcoal">Reports</h1>
        <p className="text-brand-muted mt-1">Daily sales, product sales, outstanding & inventory reports</p>
      </div>
      <ReportsPanel />
    </div>
  );
}
