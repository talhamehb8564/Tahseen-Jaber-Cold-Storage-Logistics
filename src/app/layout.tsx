import type { Metadata, Viewport } from "next";

import "@/app/globals.css";
import { ColdAtmosphere } from "@/components/global/cold-atmosphere";
import { FrostCanvas } from "@/components/global/frost-canvas";
import { CustomCursor } from "@/components/global/custom-cursor";
import { Footer } from "@/components/navigation/footer";
import { Navbar } from "@/components/navigation/navbar";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.seo.url),
  title: {
    default: siteConfig.seo.defaultTitle,
    template: siteConfig.seo.titleTemplate,
  },
  description: siteConfig.seo.defaultDescription,
  keywords: [...siteConfig.seo.keywords],
  applicationName: siteConfig.brand.name,
  authors: [{ name: siteConfig.brand.name }],
  creator: siteConfig.brand.name,
  publisher: siteConfig.brand.name,
  formatDetection: { telephone: false, address: false, email: false },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: siteConfig.seo.locale,
    url: siteConfig.seo.url,
    siteName: siteConfig.brand.name,
    title: siteConfig.seo.defaultTitle,
    description: siteConfig.seo.defaultDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.seo.defaultTitle,
    description: siteConfig.seo.defaultDescription,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export const viewport: Viewport = {
  themeColor: "#030712",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        {/* Self-hosted fonts: preload the two faces the hero depends on so the
            first paint never waits on a render-blocking stylesheet. */}
        <link
          rel="preload"
          href="/fonts/archivo-variable-latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/inter-variable-latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body className="flex min-h-svh flex-col bg-midnight font-sans text-silver antialiased">
        {/* §09 — the permanent cold atmosphere behind every route. */}
        <ColdAtmosphere />

        {/* Snow, ice crystals, fog and the pointer field, drawn on one canvas
            above the atmosphere and below the content. */}
        <FrostCanvas />

        {/* §08 — desktop-only instrument cursor; self-disables elsewhere. */}
        <CustomCursor />

        <Navbar />

        {/* `id="main"` is the skip-link target announced by the navbar. */}
        <main id="main" className="flex-1">
          {children}
        </main>

        <Footer />
      </body>
    </html>
  );
}
