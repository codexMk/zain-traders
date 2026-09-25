"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MapPin, PhoneCall } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { CounterStat } from "@/components/ui/counter-stat";
import { SpiceParticles } from "@/components/ui/spice-particles";
import { businessInfo, heroBadges, heroImages, stats } from "@/lib/site-data";

gsap.registerPlugin(ScrollTrigger);

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const elements = gsap.utils.toArray<HTMLElement>("[data-parallax]");

      elements.forEach((element) => {
        const speed = Number(element.dataset.speed ?? 0.18);

        gsap.to(element, {
          y: -140 * speed,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="home"
      ref={sectionRef}
      className="section-shell relative min-h-screen overflow-hidden pt-32"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.2),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(15,61,46,0.16),transparent_30%)]" />
      <SpiceParticles />
      <Container className="relative">
        <div className="grid gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="max-w-2xl">
            <Reveal>
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-emerald/10 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.26em] text-brand-emerald shadow-[0_12px_40px_rgba(15,61,46,0.08)]">
                <MapPin className="h-4 w-4 text-brand-gold" aria-hidden />
                {businessInfo.locationLabel}
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <p className="mt-8 text-sm font-semibold uppercase tracking-[0.36em] text-brand-gold">
                Premium Wholesale Spices & Dry Fruits
              </p>
            </Reveal>

            <Reveal delay={0.14}>
              <h1 className="mt-5 font-serif text-[3.2rem] leading-none text-brand-charcoal sm:text-[4.6rem] lg:text-[5.4rem]">
                Wholesale spices and dry fruits, chosen for trade.
              </h1>
            </Reveal>

            <Reveal delay={0.2}>
              <p className="mt-6 font-serif text-2xl leading-relaxed text-brand-emerald sm:text-3xl">
                {businessInfo.taglineMr}
              </p>
            </Reveal>

            <Reveal delay={0.28}>
              <p className="mt-4 max-w-xl text-lg leading-8 text-brand-muted sm:text-xl">
                {businessInfo.displayName} supports retailers, dealers, hotels, resellers,
                and bulk buyers with clear product information, practical pack sizes, and fast follow-up.
              </p>
            </Reveal>

            <Reveal delay={0.34}>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
                <ButtonLink href={businessInfo.whatsappHref} showArrow>
                  WhatsApp Inquiry
                </ButtonLink>
                <ButtonLink href="/products" variant="secondary" showArrow>
                  Explore Products
                </ButtonLink>
              </div>
            </Reveal>

            <Reveal delay={0.4}>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <a
                  href={businessInfo.primaryPhone.href}
                  className="inline-flex items-center gap-2 rounded-full border border-brand-emerald/14 bg-white/72 px-4 py-2 text-sm font-semibold text-brand-emerald shadow-[0_12px_32px_rgba(15,61,46,0.08)] hover:-translate-y-0.5"
                >
                  <PhoneCall className="h-4 w-4" aria-hidden />
                  Call {businessInfo.primaryPhone.number}
                </a>
                {heroBadges.map((badge) => (
                  <span
                    key={badge}
                    className="rounded-full border border-brand-emerald/10 bg-brand-cream/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-muted"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </Reveal>
          </div>

          <div className="relative min-h-[560px] sm:min-h-[640px]">
            <div
              className="absolute right-6 top-0 h-32 w-32 rounded-full bg-brand-gold/18 blur-3xl"
              data-parallax
              data-speed="0.2"
            />
            <div
              className="absolute bottom-12 left-2 h-40 w-40 rounded-full bg-brand-emerald/16 blur-3xl"
              data-parallax
              data-speed="0.12"
            />

            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 7, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              className="surface-card absolute left-0 top-14 z-10 w-[46%] overflow-hidden rounded-[30px] p-3"
              data-parallax
              data-speed="0.18"
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-[24px]">
                <Image
                  src={heroImages[1].src}
                  alt={heroImages[1].alt}
                  fill
                  sizes="(max-width: 1024px) 45vw, 24vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/0" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-gold">
                    {heroImages[1].label}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 9, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              className="dark-surface absolute right-0 top-0 w-[68%] overflow-hidden rounded-[36px] p-4"
              data-parallax
              data-speed="0.1"
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-[28px]">
                <Image
                  src={heroImages[0].src}
                  alt={heroImages[0].alt}
                  fill
                  priority
                  sizes="(max-width: 1024px) 70vw, 34vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-gold">
                    Premium catalogue presence
                  </p>
                  <h2 className="mt-3 font-serif text-3xl leading-tight">
                    Real products, cleaner presentation, and trade-ready confidence.
                  </h2>
                </div>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              className="surface-card absolute bottom-5 left-10 z-20 w-[44%] overflow-hidden rounded-[30px] p-3"
              data-parallax
              data-speed="0.16"
            >
              <div className="relative aspect-square overflow-hidden rounded-[24px]">
                <Image
                  src={heroImages[2].src}
                  alt={heroImages[2].alt}
                  fill
                  sizes="(max-width: 1024px) 44vw, 18vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                <p className="absolute bottom-4 left-4 right-4 text-xs font-semibold uppercase tracking-[0.24em] text-white">
                  Clean, sorted supply
                </p>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 6.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              className="surface-card absolute bottom-16 right-8 z-30 max-w-[240px] rounded-[28px] p-5"
              data-parallax
              data-speed="0.13"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-gold">
                Supply Focus
              </p>
              <p className="mt-3 font-serif text-2xl leading-snug text-brand-emerald">
                Retailers, dealers, hotels, and bulk buyers
              </p>
              <p className="mt-3 text-sm leading-6 text-brand-muted">
                Regional support with polished catalog visuals and quick enquiry follow-up.
              </p>
            </motion.div>
          </div>
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-3">
          {stats.map((stat) => (
            <CounterStat key={stat.label} {...stat} />
          ))}
        </div>
      </Container>
    </section>
  );
}
