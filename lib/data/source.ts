import type {
  ContactInfo,
  Faq,
  Location,
  MenuCategory,
  MenuItem,
  Navigation,
  OpeningHoursEntry,
  PageContentMap,
  PageKey,
  PageSeo,
  Restaurant,
  SeoDefaults,
  WingFlavours,
} from "@/types";

/**
 * The only contract the rest of the app depends on.
 *
 * Today it is implemented by `json-source.ts`. To move to a CMS, API or database,
 * write another implementation of this interface (for example `api-source.ts`)
 * and point `lib/data/index.ts` at it. Components and pages do not change.
 *
 * Methods are intentionally async and coarse-grained (one per "table") so a
 * remote implementation can fetch, cache and tag them however it likes.
 */
export interface DataSource {
  getRestaurant(): Promise<Restaurant>;
  getContact(): Promise<ContactInfo>;
  getLocations(): Promise<Location[]>;
  getOpeningHours(): Promise<OpeningHoursEntry[]>;
  getMenuCategories(): Promise<MenuCategory[]>;
  getMenuItems(): Promise<MenuItem[]>;
  getWingFlavours(): Promise<WingFlavours>;
  getFaqs(): Promise<Faq[]>;
  getNavigation(): Promise<Navigation>;
  getSeoDefaults(): Promise<SeoDefaults>;
  getPageSeo(page: PageKey): Promise<PageSeo>;
  getPageContent<K extends PageKey>(page: K): Promise<PageContentMap[K]>;
}
