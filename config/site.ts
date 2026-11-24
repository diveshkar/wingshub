const DEFAULT_SITE_URL = "https://wingshub.ca";

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
  /**
   * The contact form is posted to the site's own Cloudflare Function (functions/api/contact.ts), which emails
   * it. turnstileSiteKey is the public key of the optional Cloudflare Turnstile check; leave it out to switch
   * the check off (the Function must then not have TURNSTILE_SECRET_KEY set either).
   */
  contactForm: {
    endpoint: "/api/contact",
    turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "",
  },
} as const;

export function absoluteUrl(path = "/"): string {
  return `${siteConfig.url}${path.startsWith("/") ? path : `/${path}`}`;
}
