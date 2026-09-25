import { MobileContactBar } from "@/components/layout/mobile-contact-bar";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { AboutSection } from "@/components/sections/about-section";
import { BusinessFactsSection } from "@/components/sections/business-facts-section";
import { ContactSection } from "@/components/sections/contact-section";
import { HeroSection } from "@/components/sections/hero-section";
import { ProductsSection } from "@/components/sections/products-section";
import { SupplyAreasSection } from "@/components/sections/supply-areas-section";
import { WhyChooseUsSection } from "@/components/sections/why-choose-us-section";
import { localBusinessJsonLd } from "@/lib/site-data";

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
      />
      <div className="relative overflow-x-clip">
        <SiteHeader />
        <main>
          <HeroSection />
          <BusinessFactsSection />
          <AboutSection />
          <ProductsSection />
          <WhyChooseUsSection />
          <SupplyAreasSection />
          <ContactSection />
        </main>
        <SiteFooter />
        <MobileContactBar />
      </div>
    </>
  );
}
