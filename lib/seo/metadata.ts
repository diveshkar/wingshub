import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { getPageSeo, getRestaurant, getSeoDefaults } from "@/lib/data";
import type { PageKey } from "@/types";

export const PAGE_PATHS: Record<PageKey, string> = {
  home: "/",
  menu: "/menu",
  about: "/about",
  contact: "/contact",
  privacy: "/privacy",
};

/** Shared Open Graph image, generated at build time by app/opengraph-image.tsx. */
export const OG_IMAGE_PATH = "/opengraph-image";

/** Robots directive for the whole site. Draft builds are never indexable. */
export const robotsMetadata: NonNullable<Metadata["robots"]> = siteConfig.isLive
  ? {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    }
  : { index: false, follow: false };

/** Builds title, description, canonical, Open Graph and Twitter metadata for a page from data/seo.json. */
export async function buildPageMetadata(page: PageKey): Promise<Metadata> {
  const [seo, defaults, restaurant] = await Promise.all([
    getPageSeo(page),
    getSeoDefaults(),
    getRestaurant(),
  ]);
  const path = PAGE_PATHS[page];
  const fullTitle = seo.absoluteTitle ? seo.title : defaults.titleTemplate.replace("%s", seo.title);
  const image = {
    url: OG_IMAGE_PATH,
    width: 1200,
    height: 630,
    alt: `${restaurant.name}: ${restaurant.tagline}`,
  };

  return {
    title: seo.absoluteTitle ? { absolute: seo.title } : seo.title,
    description: seo.description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: restaurant.name,
      locale: siteConfig.ogLocale,
      url: path,
      title: fullTitle,
      description: seo.description,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: seo.description,
      images: [image.url],
    },
  };
}
