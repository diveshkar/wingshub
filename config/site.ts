const DEFAULT_SITE_URL = "https://wingshub.co";

/**
 * Single place for non-content configuration.
 * Business content (name, address, hours, menu...) lives in /data, not here.
 */
export const siteConfig = {
  /** Canonical production origin. Previews should still point canonicals here. */
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL).replace(/\/+$/, ""),
  locale: "en-CA",
  ogLocale: "en_CA",
  country: { code: "CA", name: "Canada" },
  currency: "CAD",
  themeColor: "#0d0d0e",
  /**
   * The site ships in draft mode: noindex, robots.txt blocks crawling and a draft
   * banner is shown. Set NEXT_PUBLIC_CONTENT_STATUS=live once every dataset in
   * /data is marked "confirmed" (the build fails otherwise).
   */
  isLive: process.env.NEXT_PUBLIC_CONTENT_STATUS === "live",
  /** Injected by next.config.ts at build time. */
  copyrightYear: process.env.NEXT_PUBLIC_BUILD_YEAR ?? "",
  /** Netlify Forms: see public/__forms.html */
  contactForm: { name: "contact", endpoint: "/__forms.html" },
} as const;

export function absoluteUrl(path = "/"): string {
  return `${siteConfig.url}${path.startsWith("/") ? path : `/${path}`}`;
}
