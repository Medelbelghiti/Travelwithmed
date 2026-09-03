import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CookieBanner } from "@/components/cookie-banner";
import { PlausibleAnalytics } from "@/components/plausible-analytics";
import { TripBadge } from "@/components/trip/add-to-trip";
import { siteConfig } from "@/lib/site";
import { websiteSchema, organizationSchema } from "@/lib/seo";
import { absoluteUrl } from "@/lib/utils";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — Travel Guides, Itineraries & Smart Travel Recommendations`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [...siteConfig.keywords],
  applicationName: siteConfig.name,
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    locale: "en_US",
    url: siteConfig.url,
    images: [
      {
        url: `/og?title=${encodeURIComponent(`${siteConfig.name} — Travel Guides, Itineraries & Smart Travel Recommendations`)}`,
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — Travel Guides, Itineraries & Smart Travel Recommendations`,
    description: siteConfig.description,
    images: [
      `/og?title=${encodeURIComponent(`${siteConfig.name} — Travel Guides, Itineraries & Smart Travel Recommendations`)}`,
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  alternates: { canonical: absoluteUrl("/") },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1570ef",
};

const jsonLd = [websiteSchema(), organizationSchema()];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <meta {...({ name: "impact-site-verification", value: "d5fe8a36-5fa2-4d62-bfc2-8539a534229c" } as Record<string, string>)} />{" "}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-xl focus:bg-brand focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        <Header />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
        <CookieBanner />
        <PlausibleAnalytics />
        <TripBadge />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}