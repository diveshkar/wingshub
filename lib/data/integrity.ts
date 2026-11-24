import type { Location, MenuCategory, MenuItem, OpeningHoursEntry, WingFlavours } from "@/types";

export class DataIntegrityError extends Error {
  constructor(problems: string[]) {
    super(`Data integrity check failed:\n${problems.map((problem) => `  - ${problem}`).join("\n")}`);
    this.name = "DataIntegrityError";
  }
}

interface Dataset {
  categories: MenuCategory[];
  items: MenuItem[];
  flavours: WingFlavours;
  locations: Location[];
  openingHours: OpeningHoursEntry[];
  /** Menu item slugs that page copy points at (for example the home page price table). */
  referencedItemSlugs: string[];
}

/**
 * Cross-file rules a schema cannot express: unique ids/slugs and valid references.
 * A database would enforce these with constraints; with JSON we enforce them at build time.
 */
export function assertDataIntegrity({
  categories,
  items,
  flavours,
  locations,
  openingHours,
  referencedItemSlugs,
}: Dataset): void {
  const problems: string[] = [];

  const findDuplicates = (label: string, file: string, values: string[]) => {
    const seen = new Set<string>();
    for (const value of values) {
      if (seen.has(value)) problems.push(`${label} "${value}" is used more than once (${file})`);
      seen.add(value);
    }
  };

  findDuplicates("Category id", "menu-categories.json", categories.map((c) => c.id));
  findDuplicates("Category slug", "menu-categories.json", categories.map((c) => c.slug));
  findDuplicates("Menu item id", "menu-items.json", items.map((i) => i.id));
  findDuplicates("Menu item slug", "menu-items.json", items.map((i) => i.slug));
  findDuplicates("Location id", "locations.json", locations.map((l) => l.id));

  const categoryIds = new Set(categories.map((c) => c.id));
  for (const item of items) {
    if (!categoryIds.has(item.categoryId)) {
      problems.push(
        `Menu item "${item.id}" points to unknown category "${item.categoryId}" (menu-items.json)`,
      );
    }
  }

  const itemSlugs = new Set(items.map((item) => item.slug));
  for (const slug of referencedItemSlugs) {
    if (!itemSlugs.has(slug)) {
      problems.push(`Page copy points at unknown menu item slug "${slug}" (data/pages/home.json)`);
    }
  }

  if (!categories.some((category) => category.slug === flavours.afterCategorySlug)) {
    problems.push(
      `Wing flavours point to unknown category slug "${flavours.afterCategorySlug}" in "afterCategorySlug" (wing-flavours.json)`,
    );
  }
  findDuplicates("Flavour group id", "wing-flavours.json", flavours.groups.map((g) => g.id));

  const locationIds = new Set(locations.map((l) => l.id));
  for (const row of openingHours) {
    if (!locationIds.has(row.locationId)) {
      problems.push(
        `Opening hours row for "${row.day}" points to unknown location "${row.locationId}" (opening-hours.json)`,
      );
    }
  }

  const primaryCount = locations.filter((l) => l.isPrimary).length;
  if (primaryCount !== 1) {
    problems.push(`Exactly one location needs "isPrimary": true, found ${primaryCount} (locations.json)`);
  }

  if (problems.length > 0) throw new DataIntegrityError(problems);
}
