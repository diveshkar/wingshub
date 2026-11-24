import { z } from "zod";
import { siteConfig } from "@/config/site";
import restaurantJson from "@/data/restaurant.json";
import contactJson from "@/data/contact.json";
import locationsJson from "@/data/locations.json";
import openingHoursJson from "@/data/opening-hours.json";
import menuCategoriesJson from "@/data/menu-categories.json";
import menuItemsJson from "@/data/menu-items.json";
import wingFlavoursJson from "@/data/wing-flavours.json";
import faqsJson from "@/data/faqs.json";
import navigationJson from "@/data/navigation.json";
import seoJson from "@/data/seo.json";
import homeJson from "@/data/pages/home.json";
import aboutJson from "@/data/pages/about.json";
import menuPageJson from "@/data/pages/menu.json";
import contactPageJson from "@/data/pages/contact.json";
import type { PageContentMap } from "@/types";
import { assertDataIntegrity } from "./integrity";
import {
  AboutPageFileSchema,
  ContactFileSchema,
  ContactPageFileSchema,
  FaqsFileSchema,
  HomePageFileSchema,
  LocationsFileSchema,
  MenuCategoriesFileSchema,
  MenuItemsFileSchema,
  MenuPageFileSchema,
  NavigationFileSchema,
  OpeningHoursFileSchema,
  RestaurantFileSchema,
  SeoFileSchema,
  WingFlavoursFileSchema,
} from "./schemas";
import type { DataSource } from "./source";

interface WithMeta {
  _meta: { status: "draft" | "confirmed"; note?: string | undefined };
}

const datasetStatuses: { file: string; status: "draft" | "confirmed"; note?: string }[] = [];

/** Validate a JSON file against its schema and fail the build with a readable message if it is wrong. */
function load<T extends WithMeta>(file: string, schema: z.ZodType<T>, raw: unknown): T {
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new Error(`Invalid data in ${file}\n${z.prettifyError(result.error)}`);
  }
  const { status, note } = result.data._meta;
  datasetStatuses.push({ file, status, ...(note ? { note } : {}) });
  return result.data;
}

function stripMeta<T extends WithMeta>(value: T): Omit<T, "_meta"> {
  return Object.fromEntries(
    Object.entries(value).filter(([key]) => key !== "_meta"),
  ) as Omit<T, "_meta">;
}

const restaurant = stripMeta(load("data/restaurant.json", RestaurantFileSchema, restaurantJson));
const contact = stripMeta(load("data/contact.json", ContactFileSchema, contactJson));
const { locations } = load("data/locations.json", LocationsFileSchema, locationsJson);
const { openingHours } = load("data/opening-hours.json", OpeningHoursFileSchema, openingHoursJson);
const { categories } = load("data/menu-categories.json", MenuCategoriesFileSchema, menuCategoriesJson);
const { items } = load("data/menu-items.json", MenuItemsFileSchema, menuItemsJson);
const flavours = stripMeta(load("data/wing-flavours.json", WingFlavoursFileSchema, wingFlavoursJson));
const { faqs } = load("data/faqs.json", FaqsFileSchema, faqsJson);
const { defaults: seoDefaults, pages: seoPages } = load("data/seo.json", SeoFileSchema, seoJson);

const navigationResult = NavigationFileSchema.safeParse(navigationJson);
if (!navigationResult.success) {
  throw new Error(`Invalid data in data/navigation.json\n${z.prettifyError(navigationResult.error)}`);
}
const navigation = navigationResult.data;

const pageContent: PageContentMap = {
  home: stripMeta(load("data/pages/home.json", HomePageFileSchema, homeJson)),
  about: stripMeta(load("data/pages/about.json", AboutPageFileSchema, aboutJson)),
  menu: stripMeta(load("data/pages/menu.json", MenuPageFileSchema, menuPageJson)),
  contact: stripMeta(load("data/pages/contact.json", ContactPageFileSchema, contactPageJson)),
};

assertDataIntegrity({
  categories,
  items,
  flavours,
  locations,
  openingHours,
  referencedItemSlugs: pageContent.home.wingsGuide.itemSlugs,
});

/**
 * Launch gate: the site cannot be built in "live" mode while any dataset still holds
 * sample or placeholder content, so draft data can never be published by accident.
 */
if (siteConfig.isLive) {
  const drafts = datasetStatuses.filter((dataset) => dataset.status !== "confirmed");
  if (drafts.length > 0) {
    const list = drafts
      .map((dataset) => `  - ${dataset.file}${dataset.note ? `: ${dataset.note}` : ""}`)
      .join("\n");
    throw new Error(
      `NEXT_PUBLIC_CONTENT_STATUS is "live" but ${drafts.length} dataset(s) are still marked "draft":\n${list}\n` +
        `Replace the placeholder content and set "_meta.status" to "confirmed" in each file.`,
    );
  }
}

export const jsonDataSource: DataSource = {
  getRestaurant: async () => restaurant,
  getContact: async () => contact,
  getLocations: async () => locations,
  getOpeningHours: async () => openingHours,
  getMenuCategories: async () => categories,
  getMenuItems: async () => items,
  getWingFlavours: async () => flavours,
  getFaqs: async () => faqs,
  getNavigation: async () => navigation,
  getSeoDefaults: async () => seoDefaults,
  getPageSeo: async (page) => seoPages[page],
  getPageContent: async (page) => pageContent[page],
};
