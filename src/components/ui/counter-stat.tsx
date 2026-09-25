"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type CounterStatProps = {
  value: number;
  label: string;
  prefix?: string;
  suffix?: string;
};

export function CounterStat({
  value,
  label,
  prefix,
  suffix,
}: CounterStatProps) {
  const [count, setCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const triggerElement = containerRef.current;

    if (!triggerElement) {
      return;
    }

    const counter = { value: 0 };
    const trigger = ScrollTrigger.create({
      trigger: triggerElement,
      start: "top 86%",
      once: true,
      onEnter: () => {
        gsap.to(counter, {
          value,
          duration: 1.6,
          ease: "power3.out",
          onUpdate: () => {
            setCount(Math.round(counter.value));
          },
        });
      },
    });

    return () => {
      trigger.kill();
    };
  }, [value]);

  return (
    <div
      ref={containerRef}
      className="surface-card rounded-[28px] p-5 text-left shadow-[0_20px_60px_rgba(15,61,46,0.1)]"
    >
      <p className="font-serif text-4xl leading-none text-brand-emerald sm:text-5xl">
        {prefix}
        {count}
        {suffix}
      </p>
      <p className="mt-3 text-sm uppercase tracking-[0.18em] text-brand-muted">
        {label}
      </p>
    </div>
  );
}
