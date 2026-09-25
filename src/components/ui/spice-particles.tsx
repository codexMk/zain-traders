"use client";

import { motion } from "framer-motion";

const particles = [
  { left: "6%", top: "14%", size: 12, duration: 9, delay: 0, color: "rgba(212, 175, 55, 0.45)" },
  { left: "14%", top: "58%", size: 18, duration: 12, delay: 1.2, color: "rgba(15, 61, 46, 0.2)" },
  { left: "22%", top: "30%", size: 8, duration: 8, delay: 0.7, color: "rgba(212, 175, 55, 0.36)" },
  { left: "32%", top: "84%", size: 10, duration: 10, delay: 0.4, color: "rgba(15, 61, 46, 0.16)" },
  { left: "44%", top: "12%", size: 16, duration: 14, delay: 1.8, color: "rgba(212, 175, 55, 0.26)" },
  { left: "52%", top: "44%", size: 14, duration: 11, delay: 2.2, color: "rgba(15, 61, 46, 0.18)" },
  { left: "62%", top: "72%", size: 11, duration: 9, delay: 0.9, color: "rgba(212, 175, 55, 0.32)" },
  { left: "74%", top: "22%", size: 22, duration: 15, delay: 1.5, color: "rgba(15, 61, 46, 0.12)" },
  { left: "86%", top: "54%", size: 9, duration: 10, delay: 0.3, color: "rgba(212, 175, 55, 0.45)" },
  { left: "92%", top: "18%", size: 14, duration: 13, delay: 2.8, color: "rgba(15, 61, 46, 0.17)" },
];

export function SpiceParticles() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((particle, index) => (
        <motion.span
          key={`${particle.left}-${particle.top}-${index}`}
          className="absolute rounded-full blur-[1px]"
          style={{
            left: particle.left,
            top: particle.top,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
          }}
          animate={{
            y: [0, -18, 10, 0],
            x: [0, 8, -6, 0],
            scale: [1, 1.15, 0.9, 1],
            rotate: [0, 30, -20, 0],
          }}
          transition={{
            duration: particle.duration,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: particle.delay,
          }}
        />
      ))}
    </div>
  );
}
