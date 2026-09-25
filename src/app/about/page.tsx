import type { Metadata } from "next";
import { MapPin, PackageCheck, UsersRound } from "lucide-react";
import { MobileContactBar } from "@/components/layout/mobile-contact-bar";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { AboutSection } from "@/components/sections/about-section";
import { SupplyAreasSection } from "@/components/sections/supply-areas-section";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "About Our Wholesale Supply",
  description:
    "Learn how Zain Traders supports retailers, dealers, hotels, resellers, and bulk buyers with wholesale spices and dry fruits from Pune and Paranda.",
  alternates: { canonical: "/about" },
};

const strengths = [
  {
    title: "Wholesale-first",
    description: "A product range and enquiry process designed around resale, commercial kitchens, and bulk buying.",
    icon: PackageCheck,
  },
  {
    title: "Regional support",
    description: "Head office support from Pune with a branch office in Paranda for grounded regional trade communication.",
    icon: MapPin,
  },
  {
    title: "Relationship-led",
    description: "Straightforward follow-up for product, grade, packing, quantity, and availability before an order is planned.",
    icon: UsersRound,
  },
];

export default function AboutPage() {
  return (
    <div className="relative overflow-x-clip">
      <SiteHeader />
      <main className="pb-28 md:pb-0">
        <section className="section-shell pt-32">
          <Container>
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-brand-gold">About Zain Traders</p>
              <h1 className="mt-5 font-serif text-4xl leading-tight text-brand-charcoal sm:text-6xl">
                A dependable supply partner for everyday and premium trade demand.
              </h1>
              <p className="mt-5 text-base leading-8 text-brand-muted sm:text-lg">
                Zain Traders is a B2B wholesale business for spices and dry fruits, serving the buyers who keep retail shelves, kitchen stores, hospitality, and reseller networks moving.
              </p>
              <ButtonLink href="/contact" variant="primary" showArrow className="mt-8">
                Start a wholesale enquiry
              </ButtonLink>
            </div>

            <div className="mt-14 grid gap-5 md:grid-cols-3">
              {strengths.map((strength) => {
                const Icon = strength.icon;
                return (
                  <div key={strength.title} className="surface-card rounded-[30px] p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-emerald text-brand-gold">
                      <Icon className="h-5 w-5" aria-hidden />
                    </div>
                    <h2 className="mt-5 font-serif text-2xl text-brand-emerald">{strength.title}</h2>
                    <p className="mt-3 text-sm leading-7 text-brand-muted">{strength.description}</p>
                  </div>
                );
              })}
            </div>
          </Container>
        </section>
        <AboutSection />
        <SupplyAreasSection />
      </main>
      <SiteFooter />
      <MobileContactBar />
    </div>
  );
}
