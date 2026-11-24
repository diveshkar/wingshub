import type { z } from "zod";
import type * as S from "@/lib/data/schemas";

/**
 * Domain types are inferred from the Zod schemas so the runtime validation and the
 * compile-time types can never drift apart. The `_meta` block is a data-file concern
 * and is stripped before records reach the rest of the app.
 */
type Strip<T> = Omit<T, "_meta">;
type ListItem<T> = T extends readonly (infer U)[] ? U : never;

export type MediaImage = z.infer<typeof S.MediaImageSchema>;
export type SocialPlatform = z.infer<typeof S.SocialPlatformSchema>;

export type Restaurant = Strip<z.infer<typeof S.RestaurantFileSchema>>;
export type SocialLink = ListItem<Restaurant["social"]>;
export type ContactInfo = Strip<z.infer<typeof S.ContactFileSchema>>;

type LocationsFile = z.infer<typeof S.LocationsFileSchema>;
export type Location = ListItem<LocationsFile["locations"]>;
export type PostalAddress = Location["address"];

type OpeningHoursFile = z.infer<typeof S.OpeningHoursFileSchema>;
export type OpeningHoursEntry = ListItem<OpeningHoursFile["openingHours"]>;
export type DayOfWeek = (typeof S.DAYS_OF_WEEK)[number];

export type CategoryIcon = z.infer<typeof S.CategoryIconSchema>;
type MenuCategoriesFile = z.infer<typeof S.MenuCategoriesFileSchema>;
export type MenuCategory = ListItem<MenuCategoriesFile["categories"]>;
type MenuItemsFile = z.infer<typeof S.MenuItemsFileSchema>;
export type MenuItem = ListItem<MenuItemsFile["items"]>;
export type MenuPrice = MenuItem["prices"][number];
export type MenuSection = MenuCategory & { items: MenuItem[] };

export type WingFlavours = Strip<z.infer<typeof S.WingFlavoursFileSchema>>;
export type WingFlavourGroup = WingFlavours["groups"][number];

/** One jump target on the menu page: a category, or the wing flavour guide. */
export interface MenuOutlineEntry {
  id: string;
  anchor: string;
  name: string;
  description: string | null;
  /** Short count label such as "7 items" or "40 flavours". */
  summary: string;
}

export type Navigation = z.infer<typeof S.NavigationFileSchema>;
export type NavLink = Navigation["header"]["cta"];

type FaqsFile = z.infer<typeof S.FaqsFileSchema>;
export type Faq = ListItem<FaqsFile["faqs"]>;

type SeoFile = z.infer<typeof S.SeoFileSchema>;
export type SeoDefaults = SeoFile["defaults"];
export type PageKey = keyof SeoFile["pages"];
export type PageSeo = SeoFile["pages"][PageKey];

export type HomeContent = Strip<z.infer<typeof S.HomePageFileSchema>>;
export type AboutContent = Strip<z.infer<typeof S.AboutPageFileSchema>>;
export type MenuPageContent = Strip<z.infer<typeof S.MenuPageFileSchema>>;
export type ContactPageContent = Strip<z.infer<typeof S.ContactPageFileSchema>>;
export type PrivacyContent = Strip<z.infer<typeof S.PrivacyPageFileSchema>>;

export interface PageContentMap {
  home: HomeContent;
  about: AboutContent;
  menu: MenuPageContent;
  contact: ContactPageContent;
  privacy: PrivacyContent;
}
