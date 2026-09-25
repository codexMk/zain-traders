"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { ProductVisual } from "@/components/products/product-visual";
import { Reveal } from "@/components/motion/reveal";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { productCategories, products } from "@/lib/site-data";
import { cn } from "@/lib/utils";

export function ProductsSection() {
  return (
    <section id="products" className="section-shell">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow="Wholesale Catalogue"
            title="Trade-ready products with the information buyers need before they enquire."
            description="Explore whole spices, dry fruits, premium blends, and seasonal trade lots. Every product detail page includes grade, packing, origin, minimum order, and a direct WhatsApp enquiry path."
            align="center"
          />
        </Reveal>

        <Reveal delay={0.08}>
          <div className="surface-card mx-auto mt-8 max-w-4xl rounded-full px-5 py-4 text-center text-sm leading-7 text-brand-muted shadow-[0_18px_45px_rgba(15,61,46,0.08)]">
            Spice and dry fruit lots curated for retailers, dealers, hotels, resellers,
            and regional trade enquiries.
          </div>
        </Reveal>

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {productCategories.map((category) => (
            <Link
              key={category.name}
              href={`/products?category=${encodeURIComponent(category.name)}`}
              className="surface-card rounded-[26px] p-5 hover:-translate-y-1"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-gold">
                Product category
              </p>
              <h3 className="mt-3 font-serif text-2xl text-brand-emerald">{category.title}</h3>
              <p className="mt-3 text-sm leading-6 text-brand-muted">{category.description}</p>
            </Link>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-gold">
              Featured products
            </p>
            <h3 className="mt-3 font-serif text-3xl text-brand-charcoal">Popular wholesale lines</h3>
          </div>
          <ButtonLink href="/products" variant="secondary" showArrow>
            Browse all products
          </ButtonLink>
        </div>

        <div className="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {products.slice(0, 8).map((product, index) => (
            <motion.div
              key={product.slug}
              initial={{ opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: index * 0.03 }}
              whileHover={{ y: -8 }}
              className="group"
            >
              <Link
                href={`/products/${product.slug}`}
                className="surface-card flex h-full flex-col overflow-hidden rounded-[30px] p-4 shadow-[0_24px_70px_rgba(15,61,46,0.08)]"
              >
                <div
                  className={cn(
                    "relative aspect-[4/3] overflow-hidden rounded-[24px] border",
                    product.cardTone === "dark"
                      ? "border-brand-gold/18 bg-[radial-gradient(circle_at_top,rgba(44,84,68,0.9),rgba(15,61,46,0.98),rgba(8,28,22,0.98))]"
                      : "border-brand-emerald/10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.94),rgba(248,244,233,0.95),rgba(230,220,194,0.82))]",
                  )}
                >
                  <ProductVisual
                    src={product.image}
                    alt={product.englishName}
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
                    className="object-contain p-5 transition duration-700 group-hover:scale-105"
                  />
                </div>

                <div className="flex flex-1 flex-col px-1 pb-1 pt-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.26em] text-brand-gold">
                        {product.category}
                      </p>
                      <h3 className="mt-3 font-serif text-3xl leading-tight text-brand-charcoal">
                        {product.name}
                      </h3>
                      <p className="mt-2 text-sm font-medium text-brand-emerald">
                        {product.englishName}
                      </p>
                    </div>
                    <span className="rounded-full border border-brand-emerald/12 bg-brand-cream/88 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-muted">
                      {product.minimumOrder}
                    </span>
                  </div>

                  <p className="mt-4 flex-1 text-sm leading-7 text-brand-muted">
                    {product.note}
                  </p>

                  <div className="mt-5 flex items-center justify-between gap-4 border-t border-brand-emerald/8 pt-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-brand-muted">
                        Grade
                      </p>
                      <p className="mt-1 text-sm font-semibold text-brand-charcoal">
                        {product.grade}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-brand-emerald">
                      View details
                      <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
