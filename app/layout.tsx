import type { Metadata, Viewport } from "next";
import { Archivo, Source_Serif_4 } from "next/font/google";
import { DraftBanner } from "@/components/layout/draft-banner";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SkipLink } from "@/components/layout/skip-link";
import { JsonLd } from "@/components/seo/json-ld";
import { siteConfig } from "@/config/site";
import { getRestaurant, getSeoDefaults } from "@/lib/data";
import { robotsMetadata } from "@/lib/seo/metadata";
import { buildSiteSchema } from "@/lib/seo/schema";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const [restaurant, defaults] = await Promise.all([getRestaurant(), getSeoDefaults()]);

  return {
    metadataBase: new URL(siteConfig.url),
    applicationName: restaurant.name,
    title: { default: restaurant.name, template: defaults.titleTemplate },
    description: defaults.description,
    robots: robotsMetadata,
    formatDetection: { telephone: false, address: false, email: false },
    openGraph: { type: "website", siteName: restaurant.name, locale: siteConfig.ogLocale },
  };
}

export const viewport: Viewport = {
  themeColor: siteConfig.themeColor,
  colorScheme: "light",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const siteSchema = await buildSiteSchema();

  return (
    <html
      lang={siteConfig.locale}
      data-scroll-behavior="smooth"
      className={`${archivo.variable} ${sourceSerif.variable}`}
    >
      <body className="flex min-h-dvh flex-col font-sans antialiased">
        <SkipLink />
        <DraftBanner />
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        <JsonLd data={siteSchema} />
      </body>
    </html>
  );
}
