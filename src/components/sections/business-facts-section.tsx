import { Building2, Handshake, MapPinned, Store, Truck } from "lucide-react";
import { Container } from "@/components/ui/container";
import { businessInfo } from "@/lib/site-data";

const facts = [
  {
    label: "Head office",
    value: "Mallik Nagar, Kondhwa, Pune 411048",
    icon: Building2,
  },
  {
    label: "Branch office",
    value: "Bus Stand, Paranda, Dharashiv 413502",
    icon: Store,
  },
  {
    label: "Service regions",
    value: businessInfo.supplyAreasLabel,
    icon: MapPinned,
  },
  {
    label: "Wholesale focus",
    value: "Retailers, dealers, hotels & bulk buyers",
    icon: Truck,
  },
  {
    label: "Trade trust",
    value: "Built through repeat supply and clear dealing",
    icon: Handshake,
  },
];

export function BusinessFactsSection() {
  return (
    <section aria-label="Zain Traders business facts" className="relative -mt-4 pb-4 sm:-mt-8">
      <Container>
        <div className="surface-card grid overflow-hidden rounded-[30px] sm:grid-cols-2 xl:grid-cols-5">
          {facts.map((fact) => {
            const Icon = fact.icon;
            return (
              <div
                key={fact.label}
                className="border-b border-brand-emerald/10 px-5 py-5 last:border-b-0 sm:odd:border-r sm:even:last:border-r-0 xl:border-b-0 xl:border-r xl:last:border-r-0"
              >
                <div className="flex items-center gap-2 text-brand-gold">
                  <Icon className="h-4 w-4" aria-hidden />
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em]">{fact.label}</p>
                </div>
                <p className="mt-3 text-sm font-semibold leading-6 text-brand-charcoal">{fact.value}</p>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
