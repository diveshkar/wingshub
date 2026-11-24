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
      disallow: ["/__forms.html"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
