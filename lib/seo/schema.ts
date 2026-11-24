import { absoluteUrl, siteConfig } from "@/config/site";
import {
  getContact,
  getFaqs,
  getMenuSections,
  getOpeningHours,
  getPrimaryLocation,
  getRestaurant,
  getWingFlavours,
} from "@/lib/data";
import { DAY_LABELS, toAbsoluteUrl } from "@/lib/utils/format";
import type { MenuSection } from "@/types";
import { OG_IMAGE_PATH } from "./metadata";

type Json = Record<string, unknown>;

const SCHEMA_CONTEXT = "https://schema.org";

/** Stable entity ids let every page point at the same restaurant and website nodes. */
export const schemaIds = {
  website: `${siteConfig.url}/#website`,
  restaurant: `${siteConfig.url}/#restaurant`,
  menu: `${siteConfig.url}/menu#menu`,
};

/** Drops empty values so unknown business details are never published as blanks or guesses. */
function compact(value: Json): Json {
  return Object.fromEntries(
    Object.entries(value).filter(
      ([, entry]) =>
        entry !== null &&
        entry !== undefined &&
        entry !== "" &&
        !(Array.isArray(entry) && entry.length === 0),
    ),
  );
}

const toAbsolute = (src: string) => toAbsoluteUrl(src, siteConfig.url);

/** WebSite + Restaurant entities. Rendered site-wide from the root layout. */
export async function buildSiteSchema(): Promise<Json> {
  const [restaurant, contact, location, hours] = await Promise.all([
    getRestaurant(),
    getContact(),
    getPrimaryLocation(),
    getOpeningHours(),
  ]);

  const photos = [restaurant.media.hero?.src, restaurant.media.about?.src]
    .filter((src): src is string => Boolean(src))
    .map(toAbsolute);

  const openingHoursSpecification = hours
    .filter((row) => row.status === "open" && row.opens && row.closes)
    .map((row) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: DAY_LABELS[row.day],
      opens: row.opens,
      closes: row.closes,
    }));

  const website = compact({
    "@type": "WebSite",
    "@id": schemaIds.website,
    url: siteConfig.url,
    name: restaurant.name,
    description: restaurant.shortDescription,
    inLanguage: siteConfig.locale,
    publisher: { "@id": schemaIds.restaurant },
  });

  const restaurantNode = compact({
    "@type": "Restaurant",
    "@id": schemaIds.restaurant,
    name: restaurant.name,
    legalName: restaurant.legalName,
    url: siteConfig.url,
    description: restaurant.description,
    image: photos.length > 0 ? photos : [absoluteUrl(OG_IMAGE_PATH)],
    logo: restaurant.logo ? toAbsolute(restaurant.logo.src) : null,
    email: contact.email,
    telephone: contact.phone,
    priceRange: restaurant.priceRange,
    paymentAccepted: restaurant.paymentMethods.join(", "),
    servesCuisine: restaurant.cuisines,
    address: compact({
      "@type": "PostalAddress",
      streetAddress: location.address.streetAddress,
      addressLocality: location.address.locality,
      addressRegion: location.address.region,
      postalCode: location.address.postalCode,
      addressCountry: location.address.country,
    }),
    geo: location.geo ? { "@type": "GeoCoordinates", ...location.geo } : null,
    hasMap: location.mapsUrl,
    openingHoursSpecification,
    areaServed: { "@type": "Country", name: siteConfig.country.name },
    acceptsReservations: restaurant.services.reservations,
    hasMenu: { "@id": schemaIds.menu },
    menu: absoluteUrl("/menu"),
    sameAs: restaurant.social.map((link) => link.url),
  });

  return { "@context": SCHEMA_CONTEXT, "@graph": [website, restaurantNode] };
}

function buildMenuSectionNode(section: MenuSection): Json {
  return compact({
    "@type": "MenuSection",
    name: section.name,
    description: section.description,
    hasMenuItem: section.items.map((item) =>
      compact({
        "@type": "MenuItem",
        name: item.name,
        description: item.description,
        image: item.image ? toAbsolute(item.image.src) : null,
        offers: item.prices.map((price) =>
          compact({
            "@type": "Offer",
            name: price.label,
            price: price.amount.toFixed(2),
            priceCurrency: siteConfig.currency,
          }),
        ),
      }),
    ),
  });
}

/**
 * schema.org Menu > MenuSection > MenuItem > Offer from the menu datasets, with the wing flavour
 * guide as nested sections (flavours have no price of their own, so they carry no offers).
 */
export async function buildMenuSchema(): Promise<Json> {
  const [restaurant, sections, flavours] = await Promise.all([
    getRestaurant(),
    getMenuSections(),
    getWingFlavours(),
  ]);

  const flavourSection = compact({
    "@type": "MenuSection",
    name: flavours.title,
    description: flavours.description,
    hasMenuSection: flavours.groups.map((group) => ({
      "@type": "MenuSection",
      name: group.name,
      hasMenuItem: group.flavours.map((flavour) => ({ "@type": "MenuItem", name: flavour })),
    })),
  });

  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "Menu",
    "@id": schemaIds.menu,
    name: `${restaurant.name} Menu`,
    url: absoluteUrl("/menu"),
    inLanguage: siteConfig.locale,
    provider: { "@id": schemaIds.restaurant },
    hasMenuSection: sections.flatMap((section) =>
      section.slug === flavours.afterCategorySlug
        ? [buildMenuSectionNode(section), flavourSection]
        : [buildMenuSectionNode(section)],
    ),
  };
}

export async function buildFaqSchema(): Promise<Json | null> {
  const faqs = await getFaqs();
  if (faqs.length === 0) return null;

  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}

export function buildBreadcrumbSchema(trail: { name: string; path: string }[]): Json {
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

type WebPageType = "WebPage" | "AboutPage" | "ContactPage" | "CollectionPage";

export function buildWebPageSchema(page: {
  type: WebPageType;
  name: string;
  description: string;
  path: string;
}): Json {
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": page.type,
    "@id": `${absoluteUrl(page.path)}#webpage`,
    url: absoluteUrl(page.path),
    name: page.name,
    description: page.description,
    inLanguage: siteConfig.locale,
    isPartOf: { "@id": schemaIds.website },
    about: { "@id": schemaIds.restaurant },
  };
}
