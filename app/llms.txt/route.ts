import { absoluteUrl, siteConfig } from "@/config/site";
import {
  getContact,
  getMenuSections,
  getOpeningHours,
  getPageContent,
  getPrimaryLocation,
  getRestaurant,
} from "@/lib/data";
import {
  formatAddressOneLine,
  formatPhone,
  groupOpeningHours,
  hasAddress,
  hasConfirmedHours,
} from "@/lib/utils/format";

/**
 * Plain-text summary for AI assistants and answer engines (the emerging llms.txt convention).
 * Built from the same datasets as the site, and only states facts that are actually known.
 */
export async function GET() {
  const [restaurant, contact, location, hours, sections, menuPage] = await Promise.all([
    getRestaurant(),
    getContact(),
    getPrimaryLocation(),
    getOpeningHours(),
    getMenuSections(),
    getPageContent("menu"),
  ]);

  const facts = [
    `- Cuisine: ${restaurant.cuisines.join(", ")}`,
    `- Country: ${siteConfig.country.name}`,
    `- Email: ${contact.email}`,
    contact.phone && `- Phone: ${formatPhone(contact.phone)}`,
    hasAddress(location.address) && `- Address: ${formatAddressOneLine(location.address)}`,
    restaurant.priceRange && `- Price range: ${restaurant.priceRange}`,
    restaurant.paymentMethods.length > 0 && `- Payment: ${restaurant.paymentMethods.join(", ")}`,
    restaurant.onlineOrdering.length > 0 &&
      `- Order online: ${restaurant.onlineOrdering.map((service) => service.name).join(", ")}`,
  ].filter(Boolean);

  const lines = [
    `# ${restaurant.name}`,
    "",
    `> ${restaurant.shortDescription}`,
    "",
    restaurant.description,
    "",
    "## Key pages",
    `- [Menu](${absoluteUrl("/menu")}): Full menu. ${menuPage.pricesNote ?? `Prices are in ${siteConfig.currency}.`}`,
    `- [About](${absoluteUrl("/about")}): About the restaurant.`,
    `- [Contact](${absoluteUrl("/contact")}): Location, opening hours and contact form.`,
    "",
    "## Facts",
    ...facts,
    "",
  ];

  if (hasConfirmedHours(hours)) {
    lines.push(
      "## Opening hours",
      ...groupOpeningHours(hours).map((group) => `- ${group.label}: ${group.hours}`),
      "",
    );
  }

  if (sections.length > 0) {
    lines.push(
      "## Menu categories",
      ...sections.map((section) => `- ${section.name}: ${section.description}`),
      "",
    );
  }

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

/** Required by `output: "export"` (see next.config.ts): this file is written once, at build time. */
export const dynamic = "force-static";
