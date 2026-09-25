import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Globe2,
  PackageCheck,
  ShoppingBag,
} from "lucide-react";
import { MobileContactBar } from "@/components/layout/mobile-contact-bar";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ProductGallery } from "@/components/products/product-gallery";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { businessInfo, getProductBySlug, productInquiryLinks, products } from "@/lib/site-data";

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  return products.map((product) => ({
    slug: product.slug,
  }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    return {
      title: "Product Not Found",
    };
  }

  return {
    title: product.englishName,
    description: `${product.englishName} from ${businessInfo.displayName}. ${product.note} Grade: ${product.grade}. Minimum order: ${product.minimumOrder}.`,
    alternates: {
      canonical: `/products/${product.slug}`,
    },
    openGraph: {
      title: `${product.englishName} | ${businessInfo.displayName}`,
      description: product.note,
      images: [
        {
          url: product.image,
          width: 960,
          height: 720,
          alt: product.englishName,
        },
      ],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const relatedProducts = products
    .filter((item) => item.slug !== product.slug && item.category === product.category)
    .slice(0, 3);

  return (
    <div className="relative overflow-x-clip">
      <SiteHeader />
      <main className="pb-28 md:pb-0">
        <section className="section-shell pt-32">
          <Container>
            <div className="mb-8 flex flex-wrap items-center gap-3 text-sm text-brand-muted">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 rounded-full border border-brand-emerald/10 bg-white/80 px-4 py-2 hover:text-brand-emerald"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
                Back to Catalogue
              </Link>
              <span>/</span>
              <span>Products</span>
              <span>/</span>
              <span className="font-medium text-brand-emerald">{product.englishName}</span>
            </div>

            <div className="grid gap-10 xl:grid-cols-[1.04fr_0.96fr] xl:items-start">
              <ProductGallery product={product} />

              <div className="space-y-6">
                <div className="surface-card rounded-[34px] p-7 sm:p-8">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full border border-brand-gold/35 bg-brand-gold/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-brand-gold">
                      {product.category}
                    </span>
                    <span className="rounded-full border border-brand-emerald/10 bg-white/82 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-brand-muted">
                      Minimum Order {product.minimumOrder}
                    </span>
                  </div>

                  <h1 className="mt-5 font-serif text-4xl leading-tight text-brand-charcoal sm:text-5xl">
                    {product.name}
                  </h1>
                  <p className="mt-3 text-lg font-medium text-brand-emerald">
                    {product.englishName}
                  </p>
                  <p className="mt-5 text-base leading-8 text-brand-muted">
                    {product.description}
                  </p>

                  <div className="mt-8 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-[24px] border border-brand-emerald/10 bg-white/82 p-4">
                      <BadgeCheck className="h-5 w-5 text-brand-gold" aria-hidden />
                      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.22em] text-brand-muted">
                        Grade
                      </p>
                      <p className="mt-2 text-base font-semibold text-brand-charcoal">
                        {product.grade}
                      </p>
                    </div>
                    <div className="rounded-[24px] border border-brand-emerald/10 bg-white/82 p-4">
                      <Globe2 className="h-5 w-5 text-brand-gold" aria-hidden />
                      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.22em] text-brand-muted">
                        Origin
                      </p>
                      <p className="mt-2 text-base font-semibold text-brand-charcoal">
                        {product.origin}
                      </p>
                    </div>
                    <div className="rounded-[24px] border border-brand-emerald/10 bg-white/82 p-4">
                      <PackageCheck className="h-5 w-5 text-brand-gold" aria-hidden />
                      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.22em] text-brand-muted">
                        Packing
                      </p>
                      <p className="mt-2 text-base font-semibold text-brand-charcoal">
                        {product.availablePacking.length} options
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <ButtonLink href={productInquiryLinks[product.slug]} showArrow>
                      Inquiry on WhatsApp
                    </ButtonLink>
                    <ButtonLink href={businessInfo.primaryPhone.href} variant="secondary">
                      Call Trade Desk
                    </ButtonLink>
                  </div>
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                  <div className="surface-card rounded-[30px] p-6">
                    <div className="flex items-center gap-3">
                      <ShoppingBag className="h-5 w-5 text-brand-gold" aria-hidden />
                      <h2 className="font-serif text-2xl text-brand-emerald">
                        Wholesale pricing & availability
                      </h2>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-brand-muted">
                      {product.wholesaleInfo}
                    </p>
                  </div>

                  <div className="surface-card rounded-[30px] p-6">
                    <div className="flex items-center gap-3">
                      <PackageCheck className="h-5 w-5 text-brand-gold" aria-hidden />
                      <h2 className="font-serif text-2xl text-brand-emerald">
                        Available Packing
                      </h2>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      {product.availablePacking.map((packing) => (
                        <span
                          key={packing}
                          className="rounded-full border border-brand-emerald/10 bg-white/82 px-4 py-2 text-sm font-medium text-brand-emerald"
                        >
                          {packing}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="surface-card rounded-[30px] p-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-gold">
                    Quality Features
                  </p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    {product.qualityFeatures.map((feature) => (
                      <div
                        key={feature}
                        className="rounded-[22px] border border-brand-emerald/10 bg-white/82 px-4 py-4 text-sm leading-6 text-brand-charcoal"
                      >
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {relatedProducts.length ? (
              <div className="mt-12">
                <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-gold">
                      More in Range
                    </p>
                    <h2 className="mt-3 font-serif text-3xl text-brand-charcoal">
                      Related trade products
                    </h2>
                  </div>
                  <ButtonLink href="/products" variant="secondary">
                    Browse Full Catalogue
                  </ButtonLink>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  {relatedProducts.map((relatedProduct) => (
                    <Link
                      key={relatedProduct.slug}
                      href={`/products/${relatedProduct.slug}`}
                      className="surface-card rounded-[28px] p-5 hover:-translate-y-1"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-gold">
                        {relatedProduct.category}
                      </p>
                      <h3 className="mt-3 font-serif text-2xl text-brand-emerald">
                        {relatedProduct.name}
                      </h3>
                      <p className="mt-2 text-sm font-medium text-brand-charcoal">
                        {relatedProduct.englishName}
                      </p>
                      <p className="mt-3 text-sm leading-7 text-brand-muted">
                        {relatedProduct.note}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </Container>
        </section>
      </main>
      <SiteFooter />
      <MobileContactBar />
    </div>
  );
}
