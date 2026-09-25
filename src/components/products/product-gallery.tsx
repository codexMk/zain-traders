"use client";

import { useState } from "react";
import { ProductVisual } from "@/components/products/product-visual";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/site";

type ProductGalleryProps = {
  product: Product;
};

export function ProductGallery({ product }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = product.gallery[activeIndex] ?? product.gallery[0];

  return (
    <div className="space-y-4">
      <div className="surface-card overflow-hidden rounded-[34px] p-4 sm:p-5">
        <div className="relative aspect-[4/3] overflow-hidden rounded-[28px] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.9),rgba(248,244,233,0.92),rgba(233,225,203,0.72))]">
          <ProductVisual
            src={activeImage.src}
            alt={activeImage.alt}
            sizes="(max-width: 1024px) 100vw, 52vw"
            priority
            className="object-cover"
            objectPosition={activeImage.objectPosition}
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-brand-charcoal/72 via-brand-charcoal/18 to-transparent px-5 py-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-gold">
              {activeImage.label}
            </p>
            <p className="mt-2 text-sm text-white/78">
              Premium wholesale preview of {product.englishName}.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {product.gallery.map((image, index) => {
          const isActive = index === activeIndex;

          return (
            <button
              key={`${product.slug}-${image.label}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={cn(
                "surface-card overflow-hidden rounded-[24px] p-2 text-left",
                isActive
                  ? "border-brand-gold/45 shadow-[0_24px_60px_rgba(15,61,46,0.14)]"
                  : "hover:-translate-y-0.5",
              )}
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-[18px] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.9),rgba(248,244,233,0.92),rgba(233,225,203,0.72))]">
                <ProductVisual
                  src={image.src}
                  alt={image.alt}
                  sizes="(max-width: 640px) 100vw, 20vw"
                  className="object-cover"
                  objectPosition={image.objectPosition}
                />
              </div>
              <div className="px-1 pb-1 pt-3">
                <p className="text-sm font-semibold text-brand-charcoal">{image.label}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-brand-muted">
                  Product gallery
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
