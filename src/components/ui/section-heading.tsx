import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description: string;
  align?: "left" | "center";
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" ? "mx-auto text-center" : "text-left",
        className,
      )}
    >
      <p className="text-sm font-semibold uppercase tracking-[0.35em] text-brand-gold">
        {eyebrow}
      </p>
      <h2 className="mt-4 font-serif text-4xl leading-tight text-brand-charcoal sm:text-5xl">
        {title}
      </h2>
      <p className="mt-5 text-base leading-7 text-brand-muted sm:text-lg">
        {description}
      </p>
    </div>
  );
}
