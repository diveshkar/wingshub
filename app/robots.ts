import type { MetadataRoute } from "next";
import { absoluteUrl, siteConfig } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  // Draft builds hide everything from crawlers so sample content can never be indexed.
  if (!siteConfig.isLive) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}

/** Required by `output: "export"` (see next.config.ts): this file is written once, at build time. */
export const dynamic = "force-static";
