"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Search } from "lucide-react";
import { ProductVisual } from "@/components/products/product-visual";
import { businessInfo, productCategories, products } from "@/lib/site-data";
import { cn } from "@/lib/utils";

type ProductCatalogProps = {
  initialCategory?: string;
};

const categories = ["All", ...productCategories.map((category) => category.name)];

export function ProductCatalog({ initialCategory }: ProductCatalogProps) {
  const validInitialCategory = categories.includes(initialCategory ?? "")
    ? initialCategory ?? "All"
    : "All";
  const [activeCategory, setActiveCategory] = useState(validInitialCategory);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setActiveCategory(validInitialCategory);
  }, [validInitialCategory]);

  const visibleProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return products.filter((product) => {
      const isInCategory = activeCategory === "All" || product.category === activeCategory;
      const matchesQuery =
        !normalizedQuery ||
        [product.name, product.englishName, product.category, product.note]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      return isInCategory && matchesQuery;
    });
  }, [activeCategory, query]);

  return (
    <div>
      <div className="surface-card rounded-[30px] p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-muted"
              aria-hidden
            />
            <label className="sr-only" htmlFor="catalogue-search">
              Search the product catalogue
            </label>
            <input
              id="catalogue-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search cumin, cashew, chilli..."
              className="w-full rounded-2xl border border-brand-emerald/12 bg-white/85 py-3 pl-12 pr-4 text-sm text-brand-charcoal outline-none placeholder:text-brand-muted/75 focus:border-brand-gold focus:ring-4 focus:ring-brand-gold/10"
            />
          </div>
          <p className="text-sm leading-6 text-brand-muted">
            {visibleProducts.length} product{visibleProducts.length === 1 ? "" : "s"} shown. Rates are shared on enquiry.
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              aria-pressed={activeCategory === category}
              className={cn(
                "rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em]",
                activeCategory === category
                  ? "border-brand-emerald bg-brand-emerald text-brand-cream"
                  : "border-brand-emerald/12 bg-white/70 text-brand-muted hover:border-brand-gold/50 hover:text-brand-emerald",
              )}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {visibleProducts.length ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {visibleProducts.map((product) => (
            <Link
              key={product.slug}
              href={`/products/${product.slug}`}
              className="surface-card group flex h-full flex-col overflow-hidden rounded-[30px] p-4 hover:-translate-y-1"
            >
              <div
                className={cn(
                  "relative aspect-[4/3] overflow-hidden rounded-[23px] border",
                  product.cardTone === "dark"
                    ? "border-brand-gold/18 bg-[radial-gradient(circle_at_top,rgba(44,84,68,0.9),rgba(15,61,46,0.98),rgba(8,28,22,0.98))]"
                    : "border-brand-emerald/10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.94),rgba(248,244,233,0.95),rgba(230,220,194,0.82))]",
                )}
              >
                <ProductVisual
                  src={product.image}
                  alt={product.englishName}
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  className="object-contain p-5 transition duration-700 group-hover:scale-105"
                />
              </div>

              <div className="flex flex-1 flex-col px-1 pb-1 pt-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-gold">
                      {product.category}
                    </p>
                    <h2 className="mt-3 font-serif text-3xl leading-tight text-brand-charcoal">
                      {product.name}
                    </h2>
                    <p className="mt-2 text-sm font-medium text-brand-emerald">
                      {product.englishName}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full border border-brand-emerald/12 bg-brand-cream/88 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-muted">
                    {product.minimumOrder}
                  </span>
                </div>

                <p className="mt-4 flex-1 text-sm leading-7 text-brand-muted">{product.note}</p>

                <div className="mt-5 flex items-center justify-between gap-4 border-t border-brand-emerald/8 pt-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-brand-muted">Grade</p>
                    <p className="mt-1 text-sm font-semibold text-brand-charcoal">{product.grade}</p>
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-brand-emerald transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="surface-card mt-8 rounded-[30px] p-8 text-center">
          <h2 className="font-serif text-3xl text-brand-emerald">No products found</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-brand-muted">
            Try a broader search, or contact {businessInfo.displayName} for a product or bulk requirement not shown in the catalogue.
          </p>
          <a
            href={businessInfo.whatsappHref}
            className="mt-6 inline-flex rounded-full bg-brand-emerald px-5 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-brand-cream"
          >
            Ask on WhatsApp
          </a>
        </div>
      )}
    </div>
  );
}
