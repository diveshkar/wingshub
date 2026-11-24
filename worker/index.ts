/**
 * The Cloudflare Worker that sits in front of the static site (see wrangler.jsonc).
 *
 * It only runs for /api/* (that is what `run_worker_first` in wrangler.jsonc says). The one route it knows is
 * the contact form, which is handled by functions/api/contact.ts. That file is shared with Cloudflare Pages,
 * which reads the `functions` folder by itself, so the same code works on either product. Anything else under
 * /api/ is a 404.
 */
import { onRequest, onRequestPost } from "../functions/api/contact";

type Env = Parameters<typeof onRequestPost>[0]["env"] & {
  /** The static files of the site. */
  ASSETS: { fetch: (request: Request) => Promise<Response> };
};

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);

    if (pathname === "/api/contact") {
      return request.method === "POST" ? onRequestPost({ request, env }) : onRequest();
    }

    // Unknown /api/ address, or a request that was sent to the Worker by mistake: let the static files answer
    // (they give the site's own 404 page).
    return env.ASSETS.fetch(request);
  },
};

export default worker;
