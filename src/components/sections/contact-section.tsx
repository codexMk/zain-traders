import { MapPin, MessageCircleMore, Phone } from "lucide-react";
import { TradeEnquiryForm } from "@/components/forms/trade-enquiry-form";
import { Reveal } from "@/components/motion/reveal";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { businessInfo } from "@/lib/site-data";

export function ContactSection() {
  return (
    <section id="contact" className="section-shell pb-28 md:pb-24">
      <Container className="grid gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
        <div>
          <Reveal>
            <SectionHeading
              eyebrow="Contact"
              title="Let’s talk wholesale enquiries, rates, and product availability."
              description="For bulk buying, repeat supply, or quick rate checks, send an enquiry on WhatsApp or call either trade line directly."
            />
          </Reveal>

          <div className="mt-8 grid gap-4">
            {businessInfo.offices.map((office, index) => (
              <Reveal key={office.label} delay={0.08 + index * 0.06}>
                <a
                  href={office.directionsUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="surface-card flex items-start gap-4 rounded-[30px] p-6 hover:-translate-y-1"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-emerald text-brand-gold">
                    <MapPin className="h-5 w-5" aria-hidden />
                  </div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.26em] text-brand-gold">
                      {office.label}
                    </p>
                    <p className="mt-3 text-base leading-7 text-brand-charcoal">{office.address}</p>
                  </div>
                </a>
              </Reveal>
            ))}

            {businessInfo.contactNumbers.map((contact, index) => (
              <Reveal key={contact.number} delay={0.22 + index * 0.06}>
                <a
                  href={contact.href}
                  className="surface-card flex items-center gap-4 rounded-[30px] p-6 hover:-translate-y-1"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-emerald text-brand-gold">
                    <Phone className="h-5 w-5" aria-hidden />
                  </div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.26em] text-brand-gold">
                      {contact.label}
                    </p>
                    <p className="mt-2 text-xl font-semibold text-brand-charcoal">{contact.number}</p>
                  </div>
                </a>
              </Reveal>
            ))}

            <Reveal delay={0.36}>
              <div className="dark-surface rounded-[30px] p-6 text-brand-cream">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/8 text-brand-gold">
                    <MessageCircleMore className="h-5 w-5" aria-hidden />
                  </div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.26em] text-brand-gold">
                      Preferred contact
                    </p>
                    <p className="mt-3 text-base leading-7 text-brand-cream/76">
                      WhatsApp is the fastest way to discuss current rates, stock, packing, and minimum-order details for wholesale supply.
                    </p>
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                      <ButtonLink href={businessInfo.whatsappHref} variant="ghost">
                        WhatsApp enquiry
                      </ButtonLink>
                      <ButtonLink href={businessInfo.mapDirectionsUrl} variant="ghost">
                        Open head office map
                      </ButtonLink>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>

        <div className="space-y-5">
          <Reveal>
            <div className="surface-card overflow-hidden rounded-[36px] p-3 sm:p-4">
              <div className="overflow-hidden rounded-[28px]">
                <iframe
                  title="Zain Traders head office location map"
                  src={businessInfo.mapEmbedUrl}
                  className="h-[360px] w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <TradeEnquiryForm />
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
