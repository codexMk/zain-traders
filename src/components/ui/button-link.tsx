import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

type ButtonLinkProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "ghost";
  showArrow?: boolean;
};

const variantClasses = {
  primary:
    "bg-brand-emerald text-brand-cream shadow-[0_18px_45px_rgba(15,61,46,0.22)] hover:-translate-y-0.5 hover:bg-[#124a38]",
  secondary:
    "border border-brand-emerald/20 bg-white/70 text-brand-emerald hover:-translate-y-0.5 hover:border-brand-gold/50 hover:bg-white",
  ghost:
    "border border-white/14 bg-white/10 text-white hover:-translate-y-0.5 hover:bg-white/18",
} as const;

export function ButtonLink({
  href,
  children,
  className,
  variant = "primary",
  showArrow = false,
}: ButtonLinkProps) {
  const opensInNewTab = href.startsWith("http");

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold tracking-[0.18em] uppercase",
        variantClasses[variant],
        className,
      )}
      target={opensInNewTab ? "_blank" : undefined}
      rel={opensInNewTab ? "noreferrer noopener" : undefined}
    >
      <span className="inline-flex items-center gap-2">{children}</span>
      {showArrow ? <ArrowUpRight className="h-4 w-4" aria-hidden /> : null}
    </Link>
  );
}
