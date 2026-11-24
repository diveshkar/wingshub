import type { NextConfig } from "next";

/**
 * The site is built as plain static files (`output: "export"`, written to the `out` folder) and hosted on
 * Cloudflare Pages. That has a few consequences:
 *   - There is no server, so security headers live in `public/_headers` (Cloudflare reads that file)
 *     and not in a `headers()` function here.
 *   - Cache Components needs a server, so it is off.
 *   - Photos are not resized by a server. They are shrunk once, by hand, before they are committed.
 *   - The contact form is posted to a Cloudflare Pages Function (`functions/api/contact.ts`).
 */
const nextConfig: NextConfig = {
  output: "export",
  reactCompiler: true,
  poweredByHeader: false,
  // Never ship source maps to visitors.
  productionBrowserSourceMaps: false,
  // Lets the development server be opened through an ngrok address. Without this, Next.js refuses the
  // dev-only scripts for any host except localhost, so the page loads but nothing that needs JavaScript
  // (the opening, the scroll story, the crumbs) works. It has no effect on the live site.
  allowedDevOrigins: ["*.ngrok-free.app", "*.ngrok-free.dev", "*.ngrok.app", "*.ngrok.dev", "*.ngrok.io"],
  env: {
    // Evaluated by Node when the config loads, not during render.
    NEXT_PUBLIC_BUILD_YEAR: String(new Date().getFullYear()),
  },
  images: {
    // A static site has no image server. next/image still gives every picture a fixed size (no layout
    // shift) and lazy loading, but serves the file as it is.
    unoptimized: true,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
