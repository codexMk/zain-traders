import Link from "next/link";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { businessInfo, navItems } from "@/lib/site-data";

export function SiteFooter() {
  return (
    <footer className="border-t border-brand-emerald/10 bg-brand-emerald text-brand-cream">
      <Container className="py-12">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-brand-gold">
              Zain Traders
            </p>
            <h2 className="mt-4 font-serif text-3xl sm:text-4xl">{businessInfo.name}</h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-brand-cream/76">
              Wholesale spices and dry fruits for retailers, dealers, hotels,
              resellers, and bulk buyers—supported from Pune and Paranda with
              responsive, trade-first communication.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href={businessInfo.whatsappHref} variant="ghost">
                Start WhatsApp Inquiry
              </ButtonLink>
              <ButtonLink href="/login" variant="ghost">
                Staff login
              </ButtonLink>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-brand-gold/80">
                Navigation
              </p>
              <div className="mt-4 flex flex-col gap-3">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-base text-brand-cream/78 hover:text-brand-gold"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-brand-gold/80">
                Contact
              </p>
              <div className="mt-4 flex flex-col gap-3 text-base text-brand-cream/78">
                {businessInfo.contactNumbers.map((item) => (
                  <a key={item.number} href={item.href} className="hover:text-brand-gold">
                    {item.number}
                  </a>
                ))}
                <a href={businessInfo.mapDirectionsUrl} className="hover:text-brand-gold">
                  {businessInfo.address}
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="gold-divider mt-10" />

        <div className="mt-6 flex flex-col gap-3 text-sm text-brand-cream/60 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {businessInfo.displayName}. All rights reserved.
          </p>
          <p>Built for wholesale discovery, direct enquiries, and lasting trade relationships.</p>
        </div>
      </Container>
    </footer>
  );
}
