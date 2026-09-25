import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { LenisProvider } from "@/components/providers/lenis-provider";
import { businessInfo, seoDescription, seoKeywords, siteUrl } from "@/lib/site-data";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${businessInfo.displayName} | Premium Wholesale Spices & Dry Fruits`,
    template: `%s | ${businessInfo.displayName}`,
  },
  description: seoDescription,
  applicationName: businessInfo.displayName,
  keywords: seoKeywords,
  authors: [{ name: businessInfo.displayName }],
  creator: businessInfo.displayName,
  publisher: businessInfo.displayName,
  category: "business",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: `${businessInfo.displayName} | Premium Wholesale Spices & Dry Fruits`,
    description: seoDescription,
    url: siteUrl,
    siteName: businessInfo.displayName,
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: `${businessInfo.displayName} premium wholesale spices and dry fruits`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${businessInfo.displayName} | Premium Wholesale Spices & Dry Fruits`,
    description: seoDescription,
    images: ["/twitter-image"],
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  other: {
    "geo.region": "IN-MH",
    "geo.placename": "Pune and Paranda, Maharashtra",
  },
};

export const viewport: Viewport = {
  themeColor: "#0F3D2E",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-IN" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${playfairDisplay.variable} bg-background font-sans text-foreground antialiased`}
      >
        <LenisProvider>{children}</LenisProvider>
      </body>
    </html>
  );
}
