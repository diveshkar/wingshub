import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/config/site";
import { PAGE_PATHS } from "@/lib/seo/metadata";
import type { PageKey } from "@/types";

type Entry = Pick<MetadataRoute.Sitemap[number], "changeFrequency" | "priority">;

/**
 * lastModified is deliberately omitted: it is only trusted by search engines when it is
 * accurate, and a build timestamp would claim every page changed on every deploy.
 */
const ENTRIES: Record<PageKey, Entry> = {
  home: { changeFrequency: "monthly", priority: 1 },
  menu: { changeFrequency: "weekly", priority: 0.9 },
  contact: { changeFrequency: "yearly", priority: 0.7 },
  about: { changeFrequency: "yearly", priority: 0.6 },
  privacy: { changeFrequency: "yearly", priority: 0.2 },
};

export default function sitemap(): MetadataRoute.Sitemap {
  return (Object.keys(PAGE_PATHS) as PageKey[]).map((page) => ({
    url: absoluteUrl(PAGE_PATHS[page]),
    ...ENTRIES[page],
  }));
}
