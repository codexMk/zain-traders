import type { Metadata } from "next";
import { MobileContactBar } from "@/components/layout/mobile-contact-bar";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ProductCatalog } from "@/components/products/product-catalog";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Wholesale Product Catalogue",
  description:
    "Explore Zain Traders wholesale spices, dry fruits, premium blends, and seasonal trade lots. View grade, packing, origin, and minimum-order guidance before you enquire.",
  alternates: { canonical: "/products" },
};

type ProductsPageProps = {
  searchParams: Promise<{ category?: string }>;
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { category } = await searchParams;

  return (
    <div className="relative overflow-x-clip">
      <SiteHeader />
      <main className="pb-28 md:pb-0">
        <section className="section-shell pt-32">
          <Container>
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-brand-gold">
                Product catalogue
              </p>
              <h1 className="mt-5 font-serif text-4xl leading-tight text-brand-charcoal sm:text-6xl">
                Products for wholesale buyers who value clear supply information.
              </h1>
              <p className="mt-5 text-base leading-8 text-brand-muted sm:text-lg">
                Search the range, compare packing and minimum-order guidance, then enquire directly for the current wholesale rate and availability.
              </p>
            </div>
            <div className="mt-12">
              <ProductCatalog initialCategory={category} />
            </div>
          </Container>
        </section>
      </main>
      <SiteFooter />
      <MobileContactBar />
    </div>
  );
}
