# Wings Hub website

Static-first marketing site for Wings Hub, a restaurant brand serving customers in Canada.
Built with Next.js 16 (App Router), React 19, TypeScript and Tailwind CSS 4, exported as plain static files and
hosted on Cloudflare (a Worker with static assets).

All business content lives in JSON files under `/data`, behind a small data-access layer, so the
site can later move to a CMS, API or database without rebuilding the front end.

## Quick start

Requires Node.js 20.9 or newer.

```bash
npm install
npm run dev        # http://localhost:3000
```

| Command             | What it does                                     |
| ------------------- | ------------------------------------------------ |
| `npm run dev`       | Development server                               |
| `npm run build`     | Production build (also validates all data files) |
| `npm run start`     | Serve the production build                       |
| `npm run lint`      | ESLint                                           |
| `npm run typecheck` | Generate route types and run TypeScript          |

## Project structure

```
app/                  Routes and metadata files (pages, layout, sitemap, robots, llms.txt, OG image, icons)
components/
  layout/             Header, mobile menu, footer, skip link, draft banner
  sections/           Page sections (hero, wings guide, featured dishes, visit, FAQ, page title band)
  menu/               Photo cards, text list rows, menu sections, flavour guide, sticky category nav
  contact/            Contact form and map
  seo/                JSON-LD renderer
  ui/                 Reusable primitives (button, container, section, logo, price line, images, icons)
config/site.ts        Non-content configuration (domain, locale, currency, launch switch)
data/                 JSON datasets: the "database" for now (see below)
lib/
  data/               Data-access layer: schemas, validation, DataSource, queries
  seo/                Metadata and schema.org builders
  utils/              Formatting helpers
types/                Domain types (inferred from the Zod schemas)
public/images/        Photos and brand assets (brand, hero, menu, about)
public/_headers       Security and cache headers (Cloudflare reads this file)
public/_redirects     Rewrites that let page-to-page navigation find the exported page data
```

## Managing content

Every page reads its content from `/data`. Components contain no business details.

| File                           | Contents                                                       |
| ------------------------------ | -------------------------------------------------------------- |
| `restaurant.json`              | Name, tagline, descriptions, cuisines, logo, hero/about photos, social links, payment methods, online ordering (Uber Eats, DoorDash), services |
| `contact.json`                 | Email and phone                                                |
| `locations.json`               | Address, coordinates, Google Maps link (supports many locations) |
| `opening-hours.json`           | Hours per day and location (24-hour HH:MM, midnight is `00:00`). Days with the same hours show as one line, for example "Every day" |
| `menu-categories.json`         | Menu categories, in display order                              |
| `menu-items.json`              | Dishes, descriptions, prices, spicy level, photos              |
| `wing-flavours.json`           | The wing flavour guide: flavours grouped by style              |
| `faqs.json`                    | FAQ entries (also published as FAQPage structured data)        |
| `seo.json`                     | Page titles and meta descriptions                              |
| `navigation.json`              | Header and footer links                                        |
| `pages/*.json`                 | Headlines and copy for the home, menu, about and contact pages |

Files are validated against Zod schemas (`lib/data/schemas.ts`) and cross-checked for broken
references (`lib/data/integrity.ts`). A typo fails the build with a readable message instead of
shipping a broken page.

### Draft and live status

Each data file has a `_meta.status` of `"draft"` or `"confirmed"`.

- **Draft mode** (the default when `NEXT_PUBLIC_CONTENT_STATUS` is not set, so local development): a banner
  is shown, pages are `noindex`, and `robots.txt` disallows crawling.
- **Live mode** (`NEXT_PUBLIC_CONTENT_STATUS=live`, set as a build variable in Cloudflare): no banner,
  pages are indexable, and `robots.txt` and the sitemap are published. The build fails in live mode while any
  data file is still `"draft"`.
- All data files are now `"confirmed"`. When you add a new data file or change content that the owner has not
  seen yet, mark it `"draft"` until they have; the live build will then stop and tell you which file.

### Adding or editing a menu item

```json
{
  "id": "item-poutine",
  "slug": "poutine",
  "categoryId": "cat-fries",
  "name": "Poutine",
  "description": "Mixed cheese curds and gravy.",
  "prices": [{ "label": null, "amount": 12 }],
  "spiceLevel": null,
  "featured": true,
  "badges": [],
  "available": true,
  "image": { "src": "/images/menu/poutine.jpg", "alt": "Bowl of poutine with cheese curds and gravy" },
  "sortOrder": 8
}
```

- Prices are numbers in CAD. Items sold in sizes use several entries with labels, for example
  `{ "label": "1 lb · 1 flavour", "amount": 15 }`. Single-price items use one entry with `"label": null`.
- `description` can be `null` for items the menu lists by name and price only.
- `spiceLevel` is the "spicy level" printed on the menu (1 to 6, with 6 the hottest), or `null` when none is printed.
- `featured: true` shows the item on the home page. `available: false` hides it everywhere.
- Categories and items are ordered by `sortOrder`. `categoryId` must match a category `id`.

### Wing flavours

`wing-flavours.json` holds the flavour guide: groups of flavour names, an intro and an optional
photo. `afterCategorySlug` decides which menu category it appears after (currently `wings`). The
count shown on the site ("40 flavours") is calculated from the list.

### Adding photos

1. Put the file in `public/images/menu/` (or `hero/`, `about/`). JPG, WebP or AVIF all work.
   Name it after the dish, in lowercase with hyphens (`poutine.jpg`).
2. Reference it from the data: `"image": { "src": "/images/menu/<file>", "alt": "<description>" }`.
3. Nothing else needs changing. On the menu page, items with an `image` appear as photo cards and
   items without one appear as plain list rows (name, dotted leader, price) under the cards, so a
   dish moves into the card grid as soon as it gets a photo. The home page "From the menu" row only
   shows featured items that have a photo.

Suggested sizes: menu photos 1200 x 900 (4:3), hero 1600 x 2000 (4:5), about 1200 x 1500 (4:5).
A static site has no image server, so photos are served exactly as they are: shrink them before you add them
(menu photos about 900 px wide, JPEG quality around 78, which gives 40 to 100 KB each). Write alt text that describes what
is actually in the photo.

Ten of the supplied photos had thin stray lines (1 to 8 px) along one edge, which showed up inside
the cards, so those edges were trimmed. The untouched originals are in `.photo-backup/` (not committed).

Photos currently in `public/images/menu/` that no menu item uses: `garlic-bread.jpg`,
`cheesy-garlic-bread.jpg` (not on the supplied menu), `wings-cream-sauce-parmesan.jpg`,
`wings-three-styles.jpg`, `boneless-wings-dark.jpg` and `wing-flavours-wide.jpg`.

### Animation

**The opening (first thing on the home page).** The screen goes dark and two big fried wings fly in from
opposite sides, hit each other in the middle (a flash, a small jolt of the camera), and thick glossy sauce
bursts out across the screen, splatters on the "lens", spreads over everything and then runs down the
screen, which uncovers the first screen, where the two wings then drop onto a black board (see below). It
plays once per visit: it is skipped for visitors who asked for less motion or to save data, for anyone who
has already scrolled, and when moving between pages (the board then just shows up with the wings already
on it). A tap, key press or scroll skips it, and adding `?intro` to the address plays it again (for showing
the owner). On a live site it is also skipped if the page took more than 4.5 seconds to wake up. If anything
stalls, the CSS removes the cover by itself (5 seconds after it started playing, or 9 seconds after the page
opened if it never started), and without JavaScript it is never shown. If the graphics card cannot draw the
sauce, the wings still collide and the cover fades away.

- `components/story/intro-splash.tsx` runs it and the "full-screen opening" part at the end of
  `app/story.css` holds its timeline (impact at 1250 ms, the page's own animation allowed from 2800 ms,
  gone at 3500 ms). The wings are CSS animations on
  `public/images/intro/wing-a.webp` and `wing-b.webp`, cut out of the supplied tossing photo at its own
  resolution so their light and colour match each other and the backdrop (`backdrop.webp` is that photo's
  dark kitchen, blurred). Each wing is drawn twice, sharp and smeared, and the smear fades in as it speeds
  up. They are not mirrored, so the light is the same on both.
- The sauce is a small WebGL shader, `components/story/intro-sauce.ts`. Pieces of sauce are thrown out of
  the clash with real physics (speed, drag, gravity, a sideways bend), each as a fat head with a thin
  tail that wriggles and then pinches into beads, plus fine spray and a few blobs that hit the lens and
  slide. The shader gives them a surface height and lights them from the upper left: thick sauce is deep
  red, thin sauce shows the warm light behind it as orange, and the shine is a soft window reflection.
  It draws at a low resolution (it is soft anyway, and never more than about 0.4 million pixels, whatever the
  screen). A computer that cannot keep up gets a smaller sauce and, if that is still too slow, no opening
  (`lower()` in `intro-sauce.ts`, checked in `intro-splash.tsx`). Where WebGL is missing the cover simply fades.
- `public/images/intro/` is 50 KB in total and only loads for animated visitors' first view. Better wing
  pictures can be dropped in under the same names (a 400 to 500 px wing, transparent background, lit from
  the upper left); the sizes are set in `WINGS` in `intro-splash.tsx`.

**The first screen and the plate.** On the first screen the plate is a wide black stone board lying on the
table, tilted towards the visitor. The two wings from the opening drop onto it: each falls at constant
acceleration, squashes as it hits, hops twice and settles, with a shadow on the board that tightens as the wing
comes down. At each touchdown crumbs and flecks of sauce fly out in a fan, bounce and come to rest on the board
and the table; the flecks leave small splats. Then, as the visitor scrolls, the board stands up and turns round
(one number, `--flat`, goes from 1 to 0 and drives the tilt, the shape, the wings fading and the hero photo fading
in), and the plate stays pinned while the round window opens onto four real kitchen photos, one for each caption:
wings being **dusted** with spice, **cooked** (a fry basket), **tossed** in sauce, and a finished wing with a
**bite** taken out. Each change has its own transition: the dusting photo opens from the sieve, steam clouds over to
bring in the basket, a flash of sauce brings in the toss, and then three bites tear the toss photo away to show the
bitten wing underneath. Spice, steam, sauce drops and crumbs drift over the photos. The captions come from
`story.steps` in `data/pages/home.json` (exactly four, in that order).

- `app/story.css` holds the layout and the effects, and `components/story/` the pieces: `story-stage.tsx`
  (the board, the wings, the plate, spice, steam, sauce, crumbs), `story-scenes.tsx` (the four photos),
  `story-controller.tsx` (turns the scroll position into numbers; each number goes only onto the element that
  uses it, so the browser never re-checks the whole stage), `bite-mask.ts` (the shape of the three bites),
  `story-photos.ts` (file names and alt text) and `static-photo.tsx`. `land-sim.ts` is the physics of the
  crumbs (no page in it) and `land-fx.tsx` draws it on a canvas. The first screen waits for the opening:
  `data-intro` on the hero section is "wait" until the opening says "go" (play the landing) or "done" (show
  it finished). The wings' timing is in `app/story.css` (`--dur`, `--delay-a`, `--delay-b`, the `land-*`
  keyframes) and the touchdown times in `IMPACTS` in `land-sim.ts`: change one, change the other. To change
  the timing of the scroll part, edit `scene()` in `story-controller.tsx`.
- `public/images/story/board.webp` is the empty black marble board (1400 x 1004, rounded corners, lit from the
  upper left). It was generated, not photographed; any dark board picture of the same proportions with
  transparent corners can replace it. The two wings are the same files as in the opening
  (`public/images/intro/wing-a.webp` and `wing-b.webp`).
- The four photos are `public/images/story/dusting.webp`, `cooking.webp`, `tossing.webp` and `biting.webp`
  (square, 1200 x 1200). To use the restaurant's own pictures, replace the four files with square photos
  of the same four moments, keep the names, and update the alt text in `story-photos.ts`. The "Cooked
  until crisp." caption goes with the fry-basket photo: check how the wings are really cooked and change
  the caption in `home.json` if needed.
- `public/images/animation/sauce-splash.webp` is the splash on the Menu page header, shown from 1280 px wide.
- Loading: the four photos are not part of the first view. They are added after the page has loaded and
  the browser is idle (about 80 KB in total on a laptop), so the headline, the plate and the text arrive
  first.

There is no sauce edge under the first screen: the "How the wings work" section starts clean.

- Elsewhere the motion is CSS only (the "Motion" block in `app/globals.css`): the hero text rises in, and
  on every section the titles, cards, price table, map and questions rise and zoom in a little as they
  scroll into view (`.reveal`). The dish photos on the cards also settle from a close-up as the card
  travels up the screen (`.zoom-photo`; it follows its card's own journey, because a box that clips its
  photo is a scroller that never scrolls). Menu cards lift on hover and buttons press down. There is no
  animation library, and browsers without scroll-driven animations simply show everything at rest.
- For visitors whose device is set to reduce motion, or without JavaScript, nothing moves and nothing
  covers the page: there is no board and no wings, the plate is already round and shows the dish, and the
  four captions are plain text, each with its photo underneath (these photos are only downloaded by those
  visitors).

### Logo and icons

- `public/images/brand/logo.jpg` is the supplied logo (opaque, black background). It is used for
  structured data and social sharing, where the logo must be legible on any background.
- `public/images/brand/logo-transparent.png` is derived from it with the black made transparent,
  so it sits cleanly on the dark header and footer. It is referenced as `logoOnDark` in `restaurant.json`.
- `app/icon.png` and `app/apple-icon.png` are the favicon and home-screen icon, cut from the logo.

If a vector or transparent logo is supplied later, replace these files and update `logo` and
`logoOnDark` in `restaurant.json`. Social links appear in the footer and in structured data as
soon as they are added to `restaurant.json`.

## Moving to a CMS, API or database

Components and pages import data only from `@/lib/data`. That module reads through the
`DataSource` interface (`lib/data/source.ts`), currently implemented by `lib/data/json-source.ts`.

To switch: implement `DataSource` (for example `api-source.ts`), then change the one line in
`lib/data/index.ts` that selects it. The Zod schemas can validate API responses, and the types
stay the same. For remote photos, allow the host under `images.remotePatterns` in `next.config.ts`.

Online ordering, cart, payments, admin and order management are intentionally not built.
Nothing in the current structure blocks them: add API routes or server actions alongside `app/`
and extend the data source.

## SEO and GEO

- Titles, descriptions, canonical URLs and Open Graph/Twitter tags per page, from `seo.json`.
- schema.org JSON-LD: `WebSite`, `Restaurant` (name, cuisine, address, hours, menu link, area served),
  `Menu` > `MenuSection` > `MenuItem` > `Offer` with CAD prices (the wing flavours are nested
  sections), `FAQPage`, `BreadcrumbList` and page types. Unknown details (phone, hours) are
  omitted, never guessed.
- `sitemap.xml`, `robots.txt`, a generated 1200 x 630 share image, favicons.
- `llms.txt`: a plain-text summary for AI assistants, built from the same data.
- Semantic HTML, one `h1` per page, skip link, `en-CA` language, keyboard-friendly navigation,
  reduced-motion support.
- Performance: fully prerendered pages, self-hosted fonts, pre-shrunk images with reserved space (no
  layout shift) and lazy loading, almost no client JavaScript.

To strengthen local SEO: add the phone number, opening hours, coordinates and Google Maps link, and
keep the name, address and phone identical to the Google Business Profile.

## Deploying to Cloudflare

The site is built with `output: "export"`: `npm run build` writes plain files to the `out` folder, and Cloudflare serves
that folder as static assets (`wrangler.jsonc`). There is no database, and the only code that runs on a server is the
contact form: `worker/index.ts` answers `/api/*` and calls `functions/api/contact.ts`. Every other address is served
straight from the files. (The `functions` folder is also what Cloudflare Pages reads, so the same code runs on Pages.)

Because it is a static export, three things differ from a normal Next.js app (see `next.config.ts`):
Cache Components is off, `next/image` does not resize (photos are shrunk by hand), and the security headers live in
`public/_headers` instead of `next.config.ts`. The four special files (`robots.ts`, `sitemap.ts`,
`llms.txt/route.ts`, `opengraph-image.tsx`) carry `export const dynamic = "force-static"` for the same reason.

1. Push the repository to GitHub. In Cloudflare: Workers & Pages > Create application > Import a repository (Git), and
   pick it. Choose the production branch `cloudflare`.
2. Build settings: **Build command** `npm run build`, **Deploy command** `npx wrangler deploy` (the default). Leave
   the root directory empty. Do not let Cloudflare run any "auto-configure" for Next.js: `wrangler.jsonc` already
   says how the site is served.
3. Variables. There are two separate lists in the Worker's Settings:
   - **Build** > Variables and secrets: read when the site is built (the `NEXT_PUBLIC_*` values).
   - **Variables and secrets** (runtime): read by the contact Function when a message arrives. Mark keys as **Secret**. Plain (non-secret) variables belong in `wrangler.jsonc`; only secrets are safe to type into the dashboard.

   | Variable | List | Value |
   | --- | --- | --- |
   | `NEXT_PUBLIC_CONTENT_STATUS` | Build | `live` (without it the site is built in draft mode: banner, noindex, crawling blocked) |
   | `NEXT_PUBLIC_SITE_URL` | Build | `https://wingshub.ca` |
   | `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Build | public key of the Turnstile check (optional, see below) |
   | `BREVO_API_KEY` | Runtime | **secret**, an API key from Brevo (SMTP & API > API keys) |
   | `TURNSTILE_SECRET_KEY` | Runtime | **secret**, the matching Turnstile secret key (set together with the site key, or neither) |
   | `ALLOWED_ORIGINS` | `wrangler.jsonc` (`vars`) | addresses the form may be sent from. It is set in `wrangler.jsonc`, not in the dashboard, because `wrangler deploy` replaces plain variables typed into the dashboard with the file's; the `*.workers.dev` address is there for testing and should be removed when that address is switched off |
   | `CONTACT_TO` | Runtime | who receives the messages (default `info@wingshub.ca`) |
   | `CONTACT_FROM_EMAIL` | Runtime | sender address, a verified sender in Brevo (default `info@wingshub.ca`) |
   | `CONTACT_FROM_NAME` | Runtime | sender name in the inbox (default `Wings Hub website`) |

4. Custom domain: Worker > Settings > Domains & Routes > Add > Custom domain > `wingshub.ca` (and `www.wingshub.ca`). Cloudflare needs the
   domain's DNS on Cloudflare, so the nameservers at GoDaddy are changed to the two Cloudflare gives you. **Before
   that, make sure every mail record (MX, TXT/SPF, autodiscover, selector1/selector2 DKIM and the other CNAMEs of the
   email service) exists in Cloudflare with the orange cloud off ("DNS only"), or email stops.** `www` is
   redirected to `wingshub.ca` with a Redirect Rule.
5. **Contact form:** the page posts JSON to `/api/contact`, handled by the Worker. It checks the message again,
   verifies the Turnstile token (when Turnstile is set up) and sends one plain-text email with the Brevo API. In
   Brevo: create an account, add and verify the sender address (Senders, domains & dedicated IPs > Senders), create an
   API key, and, so the mail is not treated as spam, authenticate the domain `wingshub.ca` (Brevo gives a TXT record
   and two DKIM CNAMEs to add in Cloudflare DNS). If Brevo answers 401 "unrecognised IP address", switch off
   Authorized IPs under Security, because Cloudflare's addresses change. The Function lives in the same repository:
   do not move the `functions` folder. Locally the form shows its error message (there is no Function in
   `npm run dev`); test it on the deployed site, or locally with `npm run build` and then `npx wrangler dev`
   (pass `--var ALLOWED_ORIGINS:http://127.0.0.1:8787`, and `--var BREVO_API_KEY:...` to really send).
6. Local check of the whole thing: `npm run build`, then `npx wrangler dev` (it serves `out` and runs the Worker).
7. After every new page that is not the home page, add a line for it to `public/_redirects` (copy an existing one).
8. **Turnstile (optional but recommended):** in Cloudflare > Turnstile > Add widget, add the hostname `wingshub.ca`,
   mode Managed. Put the site key in `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and the secret key in `TURNSTILE_SECRET_KEY`,
   then deploy again (the site key is read at build time). Cloudflare's test keys (`1x00000000000000000000AA` and
   `1x0000000000000000000000000000000AA`) always pass and are handy for trying it out.

### Launch checklist

Done:

- [x] Address, phone, opening hours (3 p.m. to midnight, all seven days), menu, flavours, logo and photos
- [x] Brand name "Wings Hub" (two words; the domain and email stay `wingshub.ca`)
- [x] Privacy policy page (`/privacy`, copy in `data/pages/privacy.json`), linked from the footer
- [x] Every data file marked `"confirmed"`; `NEXT_PUBLIC_CONTENT_STATUS=live` set as a Cloudflare build variable

Still open (the site works without them, but they should be dealt with):

- [ ] Uber Eats and DoorDash links: add the URLs under `onlineOrdering` in `restaurant.json` (the names show as plain text until then)
- [ ] Opening hours: confirm with the owner whether every day really is 3 p.m. to midnight
- [ ] Optional: coordinates and Google Maps link in `locations.json`, social links in `restaurant.json`
- [ ] Photos for the menu items that still show no picture
- [ ] The four photos in `public/images/story/` (and the two wings and backdrop in `public/images/intro/`, cut from a supplied picture) look like stock pictures. Confirm they may be used commercially, or replace them with licensed or original images (the restaurant's own kitchen photos are best)
- [ ] The four captions in `home.json` (`story.steps`): "Cooked until crisp." (are the wings fried or baked?) and "Forty to choose from"
- [ ] After the first deploy: send a test message through the contact form, confirm it reaches `info@wingshub.ca` (check spam), and submit `https://wingshub.ca/sitemap.xml` in Google Search Console and Bing Webmaster Tools

## Security

The site is static: there is no database, no login, no admin area and no API of our own, so there are no
passwords or secrets to protect. The only variables are `NEXT_PUBLIC_SITE_URL` and
`NEXT_PUBLIC_CONTENT_STATUS`, which are public on purpose. Never put a real secret in a `NEXT_PUBLIC_`
variable (it is copied into the code every visitor downloads); keep real secrets in the Cloudflare dashboard and
never in the repository. `.env*` files (except `.env.example`) are git-ignored.

- **Headers** (`public/_headers`): Content-Security-Policy, Strict-Transport-Security, X-Content-Type-Options,
  X-Frame-Options, Referrer-Policy, Cross-Origin-Opener-Policy and Permissions-Policy on every route. The CSP only
  allows this site's own scripts, styles, fonts, images and requests, plus the Google Map frame. It has to allow
  inline scripts, because Next.js adds some to every page and prebuilt pages cannot use per-request nonces.
  If a new feature needs another outside service (analytics, a chat widget, a video), add its address to the
  policy or the browser will block it.
- **No CORS headers** are sent, so other websites cannot read responses from this site in a browser.
- **No source maps** are published, and the `X-Powered-By` header is off.
- **Contact form** (`components/contact/contact-form.tsx` and `functions/api/contact.ts`): React escapes everything
  that is shown. The Function only accepts a JSON POST from the site's own address (`ALLOWED_ORIGINS`), checks every
  field again (type, length, control characters, a real email address, only digits and + ( ) - . in the phone),
  refuses a body over 16 000 characters, ignores any extra field (the visitor cannot choose the recipient, the sender
  or the subject), and puts the visitor's text only in the body of the email. A hidden field catches simple bots,
  Cloudflare Turnstile (free, usually invisible) proves the sender is a person, and the browser ignores a second
  send within 5 seconds. Error answers never contain keys or provider details. The API key and the Turnstile
  secret are Cloudflare secrets, never in the repository. The only outside addresses the page may use are
  `challenges.cloudflare.com` (Turnstile) and Google Maps (`public/_headers`).
- **Data links** (`lib/data/schemas.ts`): links in the data files must be a path on this site, an anchor, an
  https address, an email link or a phone link. `javascript:` and `data:` links fail the build.
- **Rate limiting:** Cloudflare absorbs floods of ordinary requests. For the form, add one rate limiting rule in
  Cloudflare (Security > WAF > Rate limiting rules): URI path equals `/api/contact`, 5 requests per 10 seconds, action
  Block. Together with Turnstile this keeps the Brevo allowance (300 emails a day on the free plan) safe.
- **Dependencies:** run `npm audit` now and then and update with `npm update`. Major version jumps (ESLint,
  TypeScript, `@types/node`) are deliberately left alone until they are tested.
- **Accounts:** the real risk for a site like this is someone taking over an account, not the code. Turn on
  two-step sign-in for GitHub, Cloudflare, Brevo and GoDaddy, and keep the GitHub repository private if you do not want
  the history (commit author email, old stock-photo files) to be public.

## Design tokens

Colours, fonts and radii are defined once in `app/globals.css` (`@theme`). The palette follows the
logo: near-black surfaces, the logo's red (`flame`), warm off-white (`bone`) and the menu's gold
(`honey`). Headings, labels, buttons and prices use Archivo (heavy, uppercase headings like the printed
menu); descriptions and longer copy use Source Serif 4. Both load through `next/font`. Page sections
share one container width and one vertical rhythm (`components/ui/container.tsx`, `section.tsx`).
