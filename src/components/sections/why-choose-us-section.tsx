"use client";

import { motion } from "framer-motion";
import {
  BadgeIndianRupee,
  Gem,
  ShieldCheck,
  Truck,
  Zap,
} from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { whyChooseUs } from "@/lib/site-data";
import type { FeatureIconKey } from "@/types/site";

const iconMap: Record<FeatureIconKey, typeof Gem> = {
  gem: Gem,
  badgeIndianRupee: BadgeIndianRupee,
  shieldCheck: ShieldCheck,
  zap: Zap,
  truck: Truck,
};

export function WhyChooseUsSection() {
  return (
    <section id="why-us" className="section-shell">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow="Why Choose Us"
            title="Built to feel premium, dependable, and easy to do business with."
            description="Quality checks, responsive communication, and practical wholesale support give buyers a clearer path from discovery to enquiry."
          />
        </Reveal>

        <div className="mt-12 grid gap-5 lg:grid-cols-5">
          {whyChooseUs.map((feature, index) => {
            const Icon = iconMap[feature.icon];

            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.55, delay: index * 0.05 }}
                whileHover={{ y: -8 }}
                className="surface-card rounded-[30px] p-6"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-emerald text-brand-gold shadow-[0_18px_45px_rgba(15,61,46,0.18)]">
                  <Icon className="h-6 w-6" aria-hidden />
                </div>
                <h3 className="mt-6 font-serif text-2xl text-brand-emerald">
                  {feature.title}
                </h3>
                <p className="mt-4 text-sm leading-7 text-brand-muted">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
