import { countFlavours, pluralize } from "@/lib/utils/menu";
import type {
  Location,
  MenuItem,
  MenuOutlineEntry,
  MenuSection,
  OpeningHoursEntry,
  PageContentMap,
  PageKey,
  WingFlavours,
} from "@/types";
import { jsonDataSource } from "./json-source";
import { DAYS_OF_WEEK } from "./schemas";
import type { DataSource } from "./source";

/**
 * Public data API. Pages and components import from "@/lib/data" only.
 *
 * To move to a CMS, API or database, implement `DataSource` and change this one line.
 */
const source: DataSource = jsonDataSource;

function sortBy<T>(list: readonly T[], key: (item: T) => number): T[] {
  return [...list].sort((a, b) => key(a) - key(b));
}

export const getRestaurant = () => source.getRestaurant();
export const getContact = () => source.getContact();
export const getNavigation = () => source.getNavigation();
export const getSeoDefaults = () => source.getSeoDefaults();
export const getPageSeo = (page: PageKey) => source.getPageSeo(page);
export const getPageContent = <K extends PageKey>(page: K): Promise<PageContentMap[K]> =>
  source.getPageContent(page);

export async function getFaqs() {
  return sortBy(await source.getFaqs(), (faq) => faq.sortOrder);
}

export const getLocations = () => source.getLocations();

export async function getPrimaryLocation(): Promise<Location> {
  const locations = await source.getLocations();
  return locations.find((location) => location.isPrimary) ?? locations[0];
}

/** Opening hours for one location (defaults to the primary), ordered Monday to Sunday. */
export async function getOpeningHours(locationId?: string): Promise<OpeningHoursEntry[]> {
  const id = locationId ?? (await getPrimaryLocation()).id;
  const rows = await source.getOpeningHours();
  return DAYS_OF_WEEK.flatMap((day) => rows.filter((row) => row.locationId === id && row.day === day));
}

export async function getMenuCategories() {
  return sortBy(await source.getMenuCategories(), (category) => category.sortOrder);
}

/** Available items ordered by category, then by their own sort order. */
export async function getMenuItems(): Promise<MenuItem[]> {
  const [categories, items] = await Promise.all([getMenuCategories(), source.getMenuItems()]);
  const categoryOrder = new Map(categories.map((category, index) => [category.id, index]));
  return [...items.filter((item) => item.available)].sort(
    (a, b) =>
      (categoryOrder.get(a.categoryId) ?? 0) - (categoryOrder.get(b.categoryId) ?? 0) ||
      a.sortOrder - b.sortOrder,
  );
}

/** Categories with their available items attached. Empty categories are dropped. */
export async function getMenuSections(): Promise<MenuSection[]> {
  const [categories, items] = await Promise.all([getMenuCategories(), getMenuItems()]);
  return categories
    .map((category) => ({
      ...category,
      items: items.filter((item) => item.categoryId === category.id),
    }))
    .filter((section) => section.items.length > 0);
}

/** Featured items that have a photo, so the home page never shows an empty picture slot. */
export async function getFeaturedItems(limit = 4): Promise<MenuItem[]> {
  const items = await getMenuItems();
  return items.filter((item) => item.featured && item.image).slice(0, limit);
}

/** Looks up items by slug, keeping the order of the slugs given. */
export async function getMenuItemsBySlugs(slugs: readonly string[]): Promise<MenuItem[]> {
  const items = await getMenuItems();
  return slugs.flatMap((slug) => items.filter((item) => item.slug === slug));
}

export async function getWingFlavours(): Promise<WingFlavours> {
  const flavours = await source.getWingFlavours();
  return { ...flavours, groups: sortBy(flavours.groups, (group) => group.sortOrder) };
}

/** Anchor id of the flavour guide on the menu page. */
export const FLAVOURS_ANCHOR = "flavours";

/**
 * The menu page in reading order: every category, with the wing flavour guide slotted in after
 * the category named in wing-flavours.json. Drives the sticky menu nav and the home page index.
 */
export async function getMenuOutline(): Promise<MenuOutlineEntry[]> {
  const [sections, flavours] = await Promise.all([getMenuSections(), getWingFlavours()]);

  return sections.flatMap((section): MenuOutlineEntry[] => {
    const entry: MenuOutlineEntry = {
      id: section.id,
      anchor: section.slug,
      name: section.name,
      description: section.description,
      summary: pluralize(section.items.length, "item"),
    };
    if (section.slug !== flavours.afterCategorySlug) return [entry];

    return [
      entry,
      {
        id: FLAVOURS_ANCHOR,
        anchor: FLAVOURS_ANCHOR,
        name: flavours.title,
        description: flavours.description,
        summary: pluralize(countFlavours(flavours), "flavour"),
      },
    ];
  });
}
