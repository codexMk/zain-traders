"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn, Menu, PhoneCall, X } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { businessInfo, navItems } from "@/lib/site-data";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 18);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const isItemActive = (href: string) =>
    href === "/products"
      ? pathname === "/products" || pathname.startsWith("/products/")
      : pathname === href;

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <Container className="pt-4">
        <div
          className={cn(
            "surface-card rounded-[28px] px-3 py-3 transition duration-300 sm:px-5",
            isScrolled
              ? "shadow-[0_26px_85px_rgba(15,61,46,0.15)] backdrop-blur-2xl"
              : "shadow-[0_18px_55px_rgba(15,61,46,0.1)]",
          )}
        >
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-emerald font-serif text-lg font-bold text-brand-cream">
                ZT
              </div>
              <div className="min-w-0">
                <p className="truncate font-serif text-xl text-brand-emerald">
                  {businessInfo.name}
                </p>
                <p className="text-[11px] uppercase tracking-[0.2em] text-brand-muted">
                  Wholesale Spices & Dry Fruits
                </p>
              </div>
            </Link>

            <nav className="hidden items-center gap-2 lg:flex">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isItemActive(item.href) ? "page" : undefined}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition",
                    isItemActive(item.href)
                      ? "bg-brand-emerald text-brand-cream shadow-[0_12px_30px_rgba(15,61,46,0.2)]"
                      : "text-brand-charcoal hover:bg-brand-emerald/6 hover:text-brand-emerald",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="hidden items-center gap-3 sm:flex">
              <ButtonLink
                href="/login"
                variant="secondary"
                className="px-4 py-2.5 tracking-[0.15em]"
              >
                <LogIn className="h-4 w-4" aria-hidden />
                <span>Staff login</span>
              </ButtonLink>
              <ButtonLink href={businessInfo.whatsappHref} variant="primary">
                WhatsApp Inquiry
              </ButtonLink>
            </div>

            <button
              type="button"
              onClick={() => setIsMenuOpen((current) => !current)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-brand-emerald/14 bg-white/78 text-brand-emerald shadow-[0_14px_35px_rgba(15,61,46,0.08)] sm:hidden"
              aria-expanded={isMenuOpen}
              aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {isMenuOpen ? (
            <div className="border-brand-emerald/10 pt-4 sm:hidden">
              <div className="gold-divider mb-4" />
              <nav className="flex flex-col gap-2">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "rounded-2xl px-4 py-3 text-sm font-medium",
                      isItemActive(item.href)
                        ? "bg-brand-emerald text-brand-cream"
                        : "bg-white/72 text-brand-charcoal",
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              <div className="mt-4 grid gap-3">
                <ButtonLink
                  href="/login"
                  variant="secondary"
                  className="w-full justify-center tracking-[0.15em]"
                >
                  <LogIn className="h-4 w-4" aria-hidden />
                  <span>Staff login</span>
                </ButtonLink>
                <ButtonLink
                  href={businessInfo.whatsappHref}
                  variant="primary"
                  className="w-full justify-center"
                >
                  WhatsApp Inquiry
                </ButtonLink>
                <a
                  href={businessInfo.primaryPhone.href}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-brand-emerald/18 bg-white/75 px-5 py-3 text-sm font-semibold uppercase tracking-[0.15em] text-brand-emerald shadow-[0_18px_40px_rgba(15,61,46,0.08)]"
                >
                  <PhoneCall className="h-4 w-4" aria-hidden />
                  Call Trade Desk
                </a>
              </div>
            </div>
          ) : null}
        </div>
      </Container>
    </header>
  );
}
