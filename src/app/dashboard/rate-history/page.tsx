import { ArrowUpRight, MapPinned, TrendingUp } from "lucide-react";

const marketSummary = [
  { market: "Mumbai", rate: 196, change: "+2.4%" },
  { market: "Pune", rate: 188, change: "+1.9%" },
  { market: "Solapur", rate: 181, change: "+1.1%" },
  { market: "Dharashiv", rate: 175, change: "+0.8%" },
];

const productRates = [
  { product: "Jeera", mumbai: 196, pune: 188, solapur: 181, dharashiv: 175 },
  { product: "Dhana", mumbai: 142, pune: 138, solapur: 134, dharashiv: 130 },
  { product: "Badishep", mumbai: 164, pune: 159, solapur: 155, dharashiv: 151 },
  { product: "Lal Mirchi", mumbai: 210, pune: 205, solapur: 201, dharashiv: 198 },
  { product: "Cashew", mumbai: 840, pune: 825, solapur: 812, dharashiv: 804 },
];

const formatRate = (value: number) => `₹${value}/kg`;

export default function RateHistoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-brand-charcoal">Rate History</h1>
        <p className="text-brand-muted mt-1">Track live market movement across major trade locations</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {marketSummary.map((item) => (
          <div key={item.market} className="rounded-2xl border border-brand-emerald/10 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-brand-muted">{item.market}</p>
                <p className="mt-2 text-2xl font-bold text-brand-charcoal">{formatRate(item.rate)}</p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-2 text-emerald-700">
                <ArrowUpRight size={18} />
              </div>
            </div>
            <p className="mt-3 text-xs font-medium text-emerald-700">{item.change} this week</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-brand-emerald/10 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <MapPinned className="text-brand-gold" size={18} />
          <h2 className="text-lg font-semibold text-brand-charcoal">Market Price Table</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-brand-emerald/10 bg-brand-cream/60 text-left text-brand-muted">
                <th className="px-3 py-3 font-medium">Product</th>
                <th className="px-3 py-3 font-medium">Mumbai</th>
                <th className="px-3 py-3 font-medium">Pune</th>
                <th className="px-3 py-3 font-medium">Solapur</th>
                <th className="px-3 py-3 font-medium">Dharashiv</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-emerald/10">
              {productRates.map((row) => (
                <tr key={row.product} className="hover:bg-brand-cream/30">
                  <td className="px-3 py-3 font-medium text-brand-charcoal">{row.product}</td>
                  <td className="px-3 py-3">{formatRate(row.mumbai)}</td>
                  <td className="px-3 py-3">{formatRate(row.pune)}</td>
                  <td className="px-3 py-3">{formatRate(row.solapur)}</td>
                  <td className="px-3 py-3">{formatRate(row.dharashiv)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-brand-emerald/10 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="text-brand-emerald" size={18} />
          <h2 className="text-lg font-semibold text-brand-charcoal">Market Insights</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-emerald-50 p-4">
            <p className="text-sm text-brand-muted">Strongest movement</p>
            <p className="mt-2 font-semibold text-brand-charcoal">Jeera</p>
            <p className="text-sm text-emerald-700">+2.4% in Mumbai</p>
          </div>
          <div className="rounded-xl bg-amber-50 p-4">
            <p className="text-sm text-brand-muted">Regional spread</p>
            <p className="mt-2 font-semibold text-brand-charcoal">Dharashiv</p>
            <p className="text-sm text-amber-700">Most stable pricing zone</p>
          </div>
          <div className="rounded-xl bg-brand-cream p-4">
            <p className="text-sm text-brand-muted">Action</p>
            <p className="mt-2 font-semibold text-brand-charcoal">Reorder planning</p>
            <p className="text-sm text-brand-muted">Review stock before Friday dispatch</p>
          </div>
        </div>
      </div>
    </div>
  );
}
