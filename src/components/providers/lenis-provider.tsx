"use client";

import { useEffect } from "react";
import gsap from "gsap";
import Lenis from "lenis";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type LenisProviderProps = {
  children: React.ReactNode;
};

export function LenisProvider({ children }: LenisProviderProps) {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.15,
      smoothWheel: true,
      syncTouch: true,
      wheelMultiplier: 0.92,
      touchMultiplier: 1.15,
    });

    let rafId = 0;

    const raf = (time: number) => {
      lenis.raf(time);
      rafId = window.requestAnimationFrame(raf);
    };

    rafId = window.requestAnimationFrame(raf);

    const onScroll = () => ScrollTrigger.update();
    lenis.on("scroll", onScroll);

    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target;

      if (
        !(target instanceof Element) ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const link = target.closest("a[href]") as HTMLAnchorElement | null;

      if (!link || link.target === "_blank") {
        return;
      }

      const url = new URL(link.href, window.location.href);

      if (
        url.origin !== window.location.origin ||
        !url.hash ||
        url.pathname !== window.location.pathname
      ) {
        return;
      }

      const anchorTarget = document.querySelector<HTMLElement>(url.hash);

      if (!anchorTarget) {
        return;
      }

      event.preventDefault();
      lenis.scrollTo(anchorTarget, { offset: -96 });
      window.history.replaceState(null, "", `${url.pathname}${url.hash}`);
    };

    document.addEventListener("click", handleDocumentClick);

    return () => {
      document.removeEventListener("click", handleDocumentClick);
      lenis.off("scroll", onScroll);
      window.cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
