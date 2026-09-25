export type NavItem = {
  label: string;
  href: string;
};

export type ContactNumber = {
  label: string;
  number: string;
  href: `tel:${string}`;
};

export type StatItem = {
  value: number;
  label: string;
  suffix?: string;
  prefix?: string;
};

export type HeroImage = {
  src: string;
  alt: string;
  label: string;
};

export type ProductImage = {
  src: string;
  alt: string;
  label: string;
  objectPosition?: string;
};

export type AboutHighlight = {
  title: string;
  description: string;
};

export type Product = {
  slug: string;
  name: string;
  englishName: string;
  category: "Whole Spice" | "Dry Fruit" | "Premium Blend" | "Seasonal Trade Lot";
  note: string;
  image: string;
  gallery: ProductImage[];
  description: string;
  grade: string;
  origin: string;
  availablePacking: string[];
  wholesaleInfo: string;
  minimumOrder: string;
  qualityFeatures: string[];
  cardTone: "light" | "dark";
};

export type FeatureIconKey =
  | "gem"
  | "badgeIndianRupee"
  | "shieldCheck"
  | "zap"
  | "truck";

export type Feature = {
  title: string;
  description: string;
  icon: FeatureIconKey;
};

export type SupplyArea = {
  name: string;
  districtLabel: string;
  summary: string;
  coverage: string;
  highlights: string[];
  x: number;
  y: number;
};

export type BusinessInfo = {
  name: string;
  displayName: string;
  industry: string;
  taglineMr: string;
  taglineEn: string;
  address: string;
  offices: Array<{
    label: string;
    address: string;
    directionsUrl: string;
  }>;
  supplyAreasLabel: string;
  locationLabel: string;
  whatsappNumber: string;
  whatsappHref: string;
  mapEmbedUrl: string;
  mapDirectionsUrl: string;
  primaryPhone: ContactNumber;
  contactNumbers: ContactNumber[];
};
