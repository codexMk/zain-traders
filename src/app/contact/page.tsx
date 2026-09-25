import type { Metadata } from "next";
import { MobileContactBar } from "@/components/layout/mobile-contact-bar";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ContactSection } from "@/components/sections/contact-section";

export const metadata: Metadata = {
  title: "Wholesale Contact & Enquiry",
  description:
    "Contact Zain Traders for wholesale spices and dry fruits. Call or send a WhatsApp enquiry with your product, quantity, and packing requirement.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="relative overflow-x-clip">
      <SiteHeader />
      <main className="pt-20 pb-28 md:pb-0">
        <ContactSection />
      </main>
      <SiteFooter />
      <MobileContactBar />
    </div>
  );
}
