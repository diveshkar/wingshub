# Wings Hub website

Static-first marketing site for Wings Hub, a restaurant brand serving customers in Canada.
Built with Next.js 16 (App Router), React 19, TypeScript and Tailwind CSS 4, hosted on Netlify.

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
public/__forms.html   Static form definition Netlify needs to detect the contact form
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

- The site ships in **draft mode**: a banner is shown, pages are `noindex`, and `robots.txt`
  disallows crawling. This stops unfinished content from being indexed.
- Check each file (the menu was transcribed from the supplied PDF, so proofread it), then set its
  `status` to `"confirmed"`.
- When every file is confirmed, set `NEXT_PUBLIC_CONTENT_STATUS=live`. The build fails if you set
  it while any file is still `"draft"`.

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
Next.js resizes and converts them to AVIF/WebP automatically. Write alt text that describes what
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
screen, which uncovers the page. Behind it the round plate settles into place and the scroll story
starts. It plays once per visit: it is skipped for visitors who asked for less motion or to save data, for
anyone who has already scrolled, and when moving between pages. A tap, key press or scroll skips it, and
adding `?intro` to the address plays it again (for showing the owner). On a live site it is also skipped
if the page took more than 4.5 seconds to wake up. If anything stalls, the CSS removes the cover by itself
(5 seconds after it started playing, or 9 seconds after the page opened if it never started), and without
JavaScript it is never shown. If the graphics card cannot draw the sauce, the wings still collide and the
cover fades away.

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
  It draws at about half resolution (it is soft anyway), and where WebGL is missing the cover simply fades.
- `public/images/intro/` is 50 KB in total and only loads for animated visitors' first view. Better wing
  pictures can be dropped in under the same names (a 400 to 500 px wing, transparent background, lit from
  the upper left); the sizes are set in `WINGS` in `intro-splash.tsx`.

**The wing story (the plate).** The hero photo sits in a round plate; nothing is placed on top of it (the
two wings that used to drop onto it were removed because they did not match the photo). As the visitor
scrolls, the plate stays pinned and the round window opens onto four real kitchen photos, one
for each caption: wings being **dusted** with spice, **cooked** (a fry basket), **tossed** in sauce, and a
finished wing with a **bite** taken out. Each change has its own transition: the dusting photo opens from
the sieve, steam clouds over to bring in the basket, a flash of sauce brings in the toss, and then three
bites tear the toss photo away to show the bitten wing underneath. Spice, steam, sauce drops and crumbs
drift over the photos. The captions come from `story.steps` in `data/pages/home.json` (exactly four, in
that order).

- `app/story.css` holds the layout and the effects, and `components/story/` the pieces: `story-stage.tsx`
  (plate, spice, steam, sauce, crumbs), `story-scenes.tsx` (the four photos), `story-controller.tsx`
  (turns the scroll position into numbers; each number goes only onto the element that uses it, so the
  browser never re-checks the whole stage), `bite-mask.ts` (the shape of the three bites),
  `story-photos.ts` (file names and alt text) and `static-photo.tsx`. The plate's own animation waits for
  the opening: `data-intro` on the hero section is "wait" until the opening says "go". Then the plate
  rises a little and settles (`plate-arrive` in `app/story.css`) while the sauce drains off it. To change
  the timing of the scroll part, edit `scene()` in `story-controller.tsx`.
- The four photos are `public/images/story/dusting.webp`, `cooking.webp`, `tossing.webp` and `biting.webp`
  (square, 1200 x 1200). To use the restaurant's own pictures, replace the four files with square photos
  of the same four moments, keep the names, and update the alt text in `story-photos.ts`. The "Cooked
  until crisp." caption goes with the fry-basket photo: check how the wings are really cooked and change
  the caption in `home.json` if needed.
- `public/images/animation/` holds `sauce-splash.webp` (the splash on the Menu page header, shown from
  1280 px wide). It was cut out of the supplied JPGs, which are still in the same folder.
- Loading: the four photos are not part of the first view. They are added after the page has loaded and
  the browser is idle (about 80 KB in total on a laptop), so the headline, the plate and the text arrive
  first.

**The sauce edge** between the hero and "How the wings work" is drawn by the same kind of shader
(`components/story/sauce-banner.ts`, started by `sauce-canvas.tsx`): a thick band of glossy sauce with
teardrop drips, a soft red shadow on the cream, and light that slides a little as the page scrolls. It pours
when it scrolls into view and then rests. The plain CSS drips (`.sauce-fallback`) show until it starts, and
stay for visitors without JavaScript or WebGL.

- Elsewhere the motion is CSS only (the "Motion" block in `app/globals.css`): the hero text rises in, and
  on every section the titles, cards, price table, map and questions rise and zoom in a little as they
  scroll into view (`.reveal`). The dish photos on the cards also settle from a close-up as the card
  travels up the screen (`.zoom-photo`; it follows its card's own journey, because a box that clips its
  photo is a scroller that never scrolls). Menu cards lift on hover and buttons press down. There is no
  animation library, and browsers without scroll-driven animations simply show everything at rest.
- For visitors whose device is set to reduce motion, or without JavaScript, nothing moves and nothing
  covers the page: the plate shows the dish, and the four captions are plain text,
  each with its photo underneath (these photos are only downloaded by those visitors).

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
- Performance: fully prerendered pages, self-hosted fonts, responsive optimized images with
  reserved space (no layout shift), almost no client JavaScript.

To strengthen local SEO: add the phone number, opening hours, coordinates and Google Maps link, and
keep the name, address and phone identical to the Google Business Profile.

## Deploying to Netlify

1. Push the repository to GitHub and import it in Netlify. The build settings are detected
   automatically (`netlify.toml` only pins the Node version).
2. Add the domain `wingshub.ca` and choose whether `www` redirects to it.
3. Set environment variables from `.env.example` if you need to change them.
4. **Contact form:** Netlify Forms is wired through `public/__forms.html`. After the first deploy,
   open Forms in the Netlify dashboard, confirm a form named `contact` exists, and add an email
   notification to `info@wingshub.ca`. The form only works on Netlify, not in local development.

### Launch checklist

- [x] Address (`locations.json`) and menu, flavours, logo and photos supplied
- [x] Phone number in `contact.json`, opening hours in `opening-hours.json` (3 p.m. to midnight is applied to all seven days; check this with the owner)
- [ ] Uber Eats and DoorDash links: add the URLs under `onlineOrdering` in `restaurant.json` (the names show as plain text until then)
- [ ] Owner has checked the wording for halal, payment methods (cash and card) and tax (menu prices exclude tax)
- [ ] Optional: coordinates and Google Maps link in `locations.json`, social links in `restaurant.json`
- [ ] Menu transcription (`menu-categories.json`, `menu-items.json`, `wing-flavours.json`) proofread against the printed menu
- [x] Brand name confirmed as "Wings Hub" (two words; the domain and email stay `wingshub.ca`)
- [ ] Photos for the items that still show a placeholder
- [ ] The three source images in `public/images/animation/` look like stock-site previews (small, from Adobe Stock and Freepik), and the four photos in `public/images/story/` (and the two wings and backdrop in `public/images/intro/`, cut from the tossing photo) also look like stock pictures. Confirm they may be used commercially, or replace them with licensed or original images (the restaurant's own kitchen photos are best), and delete the unused JPGs from `public/` before launch
- [ ] Owner has checked the four wing story captions in `home.json` (`story.steps`), especially "Cooked until crisp." (are the wings fried or baked?) and "Forty to choose from"
- [ ] Brand copy in `pages/*.json`, `faqs.json` and `seo.json` reviewed
- [ ] Privacy policy page added (the contact form collects personal information)
- [ ] Every data file marked `"confirmed"`, then `NEXT_PUBLIC_CONTENT_STATUS=live`
- [ ] Submit `https://wingshub.ca/sitemap.xml` in Google Search Console and Bing Webmaster Tools

## Design tokens

Colours, fonts and radii are defined once in `app/globals.css` (`@theme`). The palette follows the
logo: near-black surfaces, the logo's red (`flame`), warm off-white (`bone`) and the menu's gold
(`honey`). Headings, labels, buttons and prices use Archivo (heavy, uppercase headings like the printed
menu); descriptions and longer copy use Source Serif 4. Both load through `next/font`. Page sections
share one container width and one vertical rhythm (`components/ui/container.tsx`, `section.tsx`).
