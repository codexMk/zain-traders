import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { aboutHighlights, businessInfo, heroImages } from "@/lib/site-data";

const customerTypes = [
  "Kirana Stores",
  "Hotels",
  "Resellers",
  "Dry Fruit Counters",
];

export function AboutSection() {
  return (
    <section id="about" className="section-shell">
      <Container className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div>
          <Reveal>
            <SectionHeading
              eyebrow="About Us"
              title="A family-owned wholesale business with a premium trade mindset."
              description="With a head office in Pune and a branch office in Paranda, Zain Traders is built around clear dealing, consistent supply, and a practical understanding of regional wholesale trade."
            />
          </Reveal>

          <Reveal delay={0.08}>
            <p className="mt-8 max-w-xl text-base leading-8 text-brand-muted sm:text-lg">
              {businessInfo.displayName} supplies spices and dry fruits with a careful
              focus on quality, presentation, and long-term relationships. We are
              built for wholesale buyers who need a responsive supplier, not just a
              vendor.
            </p>
          </Reveal>

          <Reveal delay={0.14}>
            <div className="mt-8 flex flex-wrap gap-3">
              {customerTypes.map((type) => (
                <span
                  key={type}
                  className="rounded-full border border-brand-emerald/10 bg-white/78 px-4 py-2 text-sm font-medium text-brand-emerald shadow-[0_12px_35px_rgba(15,61,46,0.05)]"
                >
                  {type}
                </span>
              ))}
            </div>
          </Reveal>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {aboutHighlights.map((highlight, index) => (
              <Reveal key={highlight.title} delay={0.16 + index * 0.06}>
                <div className="surface-card h-full rounded-[28px] p-5">
                  <p className="font-serif text-2xl text-brand-emerald">{highlight.title}</p>
                  <p className="mt-3 text-sm leading-7 text-brand-muted">
                    {highlight.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal>
          <div className="relative overflow-hidden rounded-[36px] p-4 dark-surface">
            <div className="relative overflow-hidden rounded-[28px]">
              <div className="relative aspect-[4/5]">
                <Image
                  src={heroImages[4].src}
                  alt={heroImages[4].alt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 44vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/22 to-transparent" />
              </div>

              <div className="absolute inset-x-0 bottom-0 p-8 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-gold">
                  Trust-led service
                </p>
                <p className="mt-4 font-serif text-3xl leading-tight">
                  “Clean lots, clear dealing, and dependable follow-up.”
                </p>
                <div className="mt-6 space-y-3">
                  {[
                    "Focused on wholesale spices, dry fruits, and dependable repeat supply",
                    "Responsive Marathi, Hindi, and English communication for enquiries",
                    "Clear communication for product, packing, availability, and bulk enquiries",
                  ].map((point) => (
                    <div key={point} className="flex items-start gap-3 text-sm text-white/80">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-gold" />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
