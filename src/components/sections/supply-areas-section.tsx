"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MapPinned } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { supplyAreas } from "@/lib/site-data";

const maharashtraPath =
  "M91 120C108 86 145 67 178 82L213 63L253 70L285 54L332 70L379 93L431 121L454 166L441 205L453 239L422 286L383 316L356 350L309 344L279 368L239 352L206 361L182 338L146 330L121 300L88 279L75 236L53 201L67 167Z";

const tradeRoutePath = "M358 146L302 214L234 286";

export function SupplyAreasSection() {
  const [selectedAreaName, setSelectedAreaName] = useState(supplyAreas[0].name);

  const selectedArea =
    supplyAreas.find((area) => area.name === selectedAreaName) ?? supplyAreas[0];

  return (
    <section id="areas" className="section-shell overflow-hidden">
      <Container className="grid gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
        <Reveal>
          <div className="dark-surface relative overflow-hidden rounded-[36px] p-5 sm:p-6">
            <div className="absolute right-4 top-4 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-brand-gold">
              Maharashtra Network
            </div>
            <div className="relative overflow-hidden rounded-[28px] border border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.14),transparent_32%),linear-gradient(180deg,#10392D_0%,#082118_100%)] p-4 sm:p-8">
              <svg viewBox="0 0 520 420" className="w-full">
                <defs>
                  <linearGradient id="stateFill" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#174937" />
                    <stop offset="100%" stopColor="#0A271D" />
                  </linearGradient>
                </defs>

                <path
                  d={maharashtraPath}
                  fill="url(#stateFill)"
                  stroke="rgba(248, 244, 233, 0.18)"
                  strokeWidth="2"
                />

                <path
                  d={tradeRoutePath}
                  fill="none"
                  stroke="#D4AF37"
                  strokeDasharray="14 10"
                  strokeLinecap="round"
                  strokeWidth="4"
                  opacity="0.55"
                />

                {supplyAreas.map((area) => {
                  const isSelected = selectedArea.name === area.name;

                  return (
                    <g
                      key={area.name}
                      role="button"
                      tabIndex={0}
                      onMouseEnter={() => setSelectedAreaName(area.name)}
                      onClick={() => setSelectedAreaName(area.name)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedAreaName(area.name);
                        }
                      }}
                      className="cursor-pointer outline-none"
                    >
                      <circle
                        cx={area.x}
                        cy={area.y}
                        r={isSelected ? 26 : 18}
                        fill="rgba(212, 175, 55, 0.16)"
                        className={isSelected ? "animate-pulse" : undefined}
                      />
                      <circle
                        cx={area.x}
                        cy={area.y}
                        r={isSelected ? 8 : 6}
                        fill="#D4AF37"
                      />
                      <text
                        x={area.x + 14}
                        y={area.y - 12}
                        fill="#F8F4E9"
                        fontSize="15"
                        fontWeight="700"
                      >
                        {area.name}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        </Reveal>

        <div>
          <Reveal>
            <SectionHeading
              eyebrow="Supply Areas"
              title="Focused regional coverage with interactive trade visibility."
              description="Our supply belt is rooted in Paranda and actively aligned with the needs of Dharashiv, Solapur, and Sambhajinagar buyers."
            />
          </Reveal>

          <motion.div
            key={selectedArea.name}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="surface-card mt-8 rounded-[32px] p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-gold">
                  {selectedArea.districtLabel}
                </p>
                <h3 className="mt-3 font-serif text-3xl text-brand-emerald">
                  {selectedArea.name}
                </h3>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-emerald text-brand-gold">
                <MapPinned className="h-6 w-6" aria-hidden />
              </div>
            </div>
            <p className="mt-5 text-base leading-8 text-brand-muted">
              {selectedArea.summary}
            </p>
            <p className="mt-4 text-sm leading-7 text-brand-muted">
              {selectedArea.coverage}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {selectedArea.highlights.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-brand-emerald/10 bg-white/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-emerald"
                >
                  {item}
                </span>
              ))}
            </div>
          </motion.div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {supplyAreas.map((area) => {
              const isSelected = selectedArea.name === area.name;

              return (
                <button
                  key={area.name}
                  type="button"
                  onClick={() => setSelectedAreaName(area.name)}
                  className={`rounded-[24px] border px-4 py-4 text-left transition ${
                    isSelected
                      ? "border-brand-gold/45 bg-brand-emerald text-brand-cream shadow-[0_20px_50px_rgba(15,61,46,0.18)]"
                      : "surface-card text-brand-charcoal hover:-translate-y-0.5 hover:border-brand-gold/35"
                  }`}
                >
                  <p className="font-serif text-2xl">{area.name}</p>
                  <p
                    className={`mt-2 text-xs uppercase tracking-[0.22em] ${
                      isSelected ? "text-brand-gold" : "text-brand-muted"
                    }`}
                  >
                    {area.districtLabel}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}
