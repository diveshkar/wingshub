import { z } from "zod";

/**
 * Zod schemas are the single source of truth for the shape of every dataset.
 * They validate the JSON files today and can validate API/database responses
 * later without touching any component.
 */

const text = z.string().trim().min(1);
const slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens only");

export const DatasetMetaSchema = z.object({
  /** "draft" = contains sample or placeholder content. "confirmed" = reviewed and safe to publish. */
  status: z.enum(["draft", "confirmed"]),
  note: z.string().optional(),
});

export const MediaImageSchema = z.object({
  src: z
    .string()
    .refine(
      (value) => value.startsWith("/") || value.startsWith("https://"),
      "Image src must be a /public path (e.g. /images/menu/item.jpg) or an https:// URL",
    ),
  alt: text,
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

/**
 * Links that come from the data files may only be a path on this site, an in-page anchor, an https
 * address, an email link or a phone link. This keeps "javascript:" and "data:" links out of the pages
 * even if a data file is edited by mistake or later comes from a CMS.
 */
const href = text.refine(
  (value) => /^(\/(?!\/)|#|https:\/\/|mailto:|tel:)/.test(value),
  "Use a path starting with /, an anchor starting with #, or an https:// address",
);
const httpsUrl = z.url({ protocol: /^https$/ });

const Cta = z.object({ label: text, href });
const SectionCopy = z.object({ title: text, description: z.string().nullable() });
const PageIntro = z.object({ title: text, intro: text });

/* ------------------------------------------------------------------ */
/* Restaurant, contact, location, hours                                */
/* ------------------------------------------------------------------ */

export const SocialPlatformSchema = z.enum(["instagram", "facebook", "tiktok", "x", "youtube"]);

export const RestaurantFileSchema = z.object({
  _meta: DatasetMetaSchema,
  id: text,
  name: text,
  legalName: z.string().nullable(),
  tagline: text,
  shortDescription: text,
  description: text,
  cuisines: z.array(text).min(1),
  priceRange: z.string().nullable(),
  /** Opaque logo, legible on any background. Used for structured data and social sharing. */
  logo: MediaImageSchema.nullable(),
  /** Transparent version for dark surfaces such as the header and footer. Falls back to `logo`. */
  logoOnDark: MediaImageSchema.nullable(),
  media: z.object({
    hero: MediaImageSchema.nullable(),
    about: MediaImageSchema.nullable(),
  }),
  social: z.array(z.object({ platform: SocialPlatformSchema, url: httpsUrl })),
  /** For example "Cash" and "Card". Shown in the FAQ and published as `paymentAccepted`. */
  paymentMethods: z.array(text),
  /** Delivery and ordering platforms. A null url shows the name as plain text until the link is added. */
  onlineOrdering: z.array(z.object({ name: text, url: httpsUrl.nullable() })),
  services: z.object({
    dineIn: z.boolean().nullable(),
    takeaway: z.boolean().nullable(),
    delivery: z.boolean().nullable(),
    reservations: z.boolean().nullable(),
  }),
});

export const ContactFileSchema = z.object({
  _meta: DatasetMetaSchema,
  email: z.email(),
  phone: z
    .string()
    .regex(/^\+[1-9]\d{6,14}$/, "Use E.164 format, e.g. +14165550100")
    .nullable(),
});

const AddressSchema = z.object({
  streetAddress: z.string().nullable(),
  locality: z.string().nullable(),
  region: z.string().nullable(),
  postalCode: z.string().nullable(),
  country: z.string().length(2),
});

const LocationSchema = z.object({
  id: text,
  name: text,
  isPrimary: z.boolean(),
  address: AddressSchema,
  geo: z
    .object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
    })
    .nullable(),
  mapsUrl: httpsUrl.nullable(),
});

export const LocationsFileSchema = z.object({
  _meta: DatasetMetaSchema,
  locations: z.array(LocationSchema).min(1),
});

export const DAYS_OF_WEEK = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

const TimeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use 24-hour HH:MM, e.g. 11:00");

const OpeningHoursEntrySchema = z
  .object({
    locationId: text,
    day: z.enum(DAYS_OF_WEEK),
    /** "tba" = not provided yet, "closed" = closed all day. */
    status: z.enum(["open", "closed", "tba"]),
    opens: TimeSchema.nullable(),
    closes: TimeSchema.nullable(),
  })
  .refine((row) => row.status !== "open" || (row.opens !== null && row.closes !== null), {
    message: 'Rows with status "open" need both opens and closes',
  });

export const OpeningHoursFileSchema = z.object({
  _meta: DatasetMetaSchema,
  openingHours: z.array(OpeningHoursEntrySchema),
});

/* ------------------------------------------------------------------ */
/* Menu                                                                */
/* ------------------------------------------------------------------ */

export const CategoryIconSchema = z.enum([
  "wings",
  "boneless",
  "appetizers",
  "fries",
  "wraps",
  "quesadillas",
  "combos",
  "extras",
  "drinks",
  "desserts",
  "default",
]);

const MenuCategorySchema = z.object({
  id: text,
  slug,
  name: text,
  description: text,
  icon: CategoryIconSchema,
  image: MediaImageSchema.nullable(),
  sortOrder: z.number().int(),
});

export const MenuCategoriesFileSchema = z.object({
  _meta: DatasetMetaSchema,
  categories: z.array(MenuCategorySchema).min(1),
});

const MenuPriceSchema = z.object({
  /** e.g. "6 pcs". Null for single-price items. */
  label: z.string().nullable(),
  amount: z.number().nonnegative(),
});

const MenuItemSchema = z.object({
  id: text,
  slug,
  categoryId: text,
  name: text,
  /** Null for items the menu lists by name and price only. */
  description: text.nullable(),
  prices: z.array(MenuPriceSchema).min(1),
  /** The "spicy level" printed on the menu, from 1 (mildest) to 6 (hottest). Null when the item is not marked. */
  spiceLevel: z.number().int().min(1).max(6).nullable(),
  featured: z.boolean(),
  badges: z.array(text),
  available: z.boolean(),
  image: MediaImageSchema.nullable(),
  sortOrder: z.number().int(),
});

export const MenuItemsFileSchema = z.object({
  _meta: DatasetMetaSchema,
  items: z.array(MenuItemSchema).min(1),
});

const WingFlavourGroupSchema = z.object({
  id: text,
  name: text,
  sortOrder: z.number().int(),
  flavours: z.array(text).min(1),
});

/** The wing flavour guide: flavour names grouped by style, shown after one menu category. */
export const WingFlavoursFileSchema = z.object({
  _meta: DatasetMetaSchema,
  title: text,
  description: z.string().nullable(),
  /** Slug of the menu category this guide appears after on the menu page. */
  afterCategorySlug: slug,
  image: MediaImageSchema.nullable(),
  groups: z.array(WingFlavourGroupSchema).min(1),
});

/* ------------------------------------------------------------------ */
/* Navigation, FAQ, SEO                                                */
/* ------------------------------------------------------------------ */

const NavLinkSchema = z.object({ label: text, href });

export const NavigationFileSchema = z.object({
  header: z.object({ links: z.array(NavLinkSchema), cta: NavLinkSchema }),
  footer: z.object({ explore: z.array(NavLinkSchema), legal: z.array(NavLinkSchema) }),
});

export const FaqsFileSchema = z.object({
  _meta: DatasetMetaSchema,
  faqs: z.array(
    z.object({
      id: text,
      question: text,
      answer: text,
      sortOrder: z.number().int(),
    }),
  ),
});

const PageSeoSchema = z.object({
  title: text,
  description: text,
  /** Skip the title template (use for the home page where the brand is already in the title). */
  absoluteTitle: z.boolean().optional(),
});

export const SeoFileSchema = z.object({
  _meta: DatasetMetaSchema,
  defaults: z.object({
    titleTemplate: z.string().includes("%s"),
    description: text,
  }),
  pages: z.object({
    home: PageSeoSchema,
    menu: PageSeoSchema,
    about: PageSeoSchema,
    contact: PageSeoSchema,
    privacy: PageSeoSchema,
  }),
});

/* ------------------------------------------------------------------ */
/* Page copy                                                           */
/* ------------------------------------------------------------------ */

const StoryStep = z.object({ title: text, text });

export const HomePageFileSchema = z.object({
  _meta: DatasetMetaSchema,
  hero: z.object({
    headline: z.array(text).min(1).max(3),
    subheadline: text,
    primaryCta: Cta,
    secondaryCta: Cta,
  }),
  /**
   * Captions for the scrolling plate. There are exactly four because the story has four scenes, each
   * with its own photo: the wings are dusted, cooked, tossed in sauce, then bitten into.
   */
  story: z.object({
    steps: z.tuple([StoryStep, StoryStep, StoryStep, StoryStep]),
  }),
  /** The "wings by the pound" explainer. The price table is built from the listed menu items. */
  wingsGuide: z.object({
    title: text,
    paragraphs: z.array(text).min(1),
    itemSlugs: z.array(slug).min(1),
    link: Cta,
  }),
  featured: SectionCopy.extend({ cta: Cta }),
  visit: SectionCopy,
  faq: SectionCopy,
});

export const AboutPageFileSchema = z.object({
  _meta: DatasetMetaSchema,
  hero: PageIntro,
  story: z.object({ paragraphs: z.array(text).min(1) }),
});

export const MenuPageFileSchema = z.object({
  _meta: DatasetMetaSchema,
  hero: PageIntro,
  pricesNote: z.string().nullable(),
  /** Explains the spicy level scale shown on some items. */
  spiceNote: z.string().nullable(),
  footnote: z.string().nullable(),
});

export const ContactPageFileSchema = z.object({
  _meta: DatasetMetaSchema,
  hero: PageIntro,
  form: z.object({
    title: text,
    description: text,
    submitLabel: text,
    successTitle: text,
    successMessage: text,
    privacyNote: z.string().nullable(),
  }),
  visit: SectionCopy,
});

export const PrivacyPageFileSchema = z.object({
  _meta: DatasetMetaSchema,
  hero: PageIntro,
  sections: z
    .array(z.object({ heading: text, paragraphs: z.array(text).min(1) }))
    .min(1),
});
