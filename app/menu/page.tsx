import type { Metadata } from "next";
import { Fragment } from "react";
import { CategoryNav } from "@/components/menu/category-nav";
import { FlavourGuide } from "@/components/menu/flavour-guide";
import { MenuSection } from "@/components/menu/menu-section";
import { PageHero } from "@/components/sections/page-hero";
import { JsonLd } from "@/components/seo/json-ld";
import { Container } from "@/components/ui/container";
import { SauceSplash } from "@/components/ui/sauce-splash";
import {
  getMenuOutline,
  getMenuSections,
  getPageContent,
  getPageSeo,
  getWingFlavours,
} from "@/lib/data";
import { PAGE_PATHS, buildPageMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbSchema, buildMenuSchema, buildWebPageSchema } from "@/lib/seo/schema";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("menu");
}

export default async function MenuPage() {
  const [content, sections, outline, flavours, seo, menuSchema] = await Promise.all([
    getPageContent("menu"),
    getMenuSections(),
    getMenuOutline(),
    getWingFlavours(),
    getPageSeo("menu"),
    buildMenuSchema(),
  ]);

  return (
    <>
      <PageHero title={content.hero.title} intro={content.hero.intro} art={<SauceSplash />}>
        {(content.pricesNote || content.spiceNote) && (
          <div className="mt-3 space-y-1 text-sm text-ink-400">
            {content.pricesNote && <p>{content.pricesNote}</p>}
            {content.spiceNote && <p>{content.spiceNote}</p>}
          </div>
        )}
      </PageHero>

      <CategoryNav items={outline.map(({ anchor, name }) => ({ slug: anchor, name }))} />

      <div className="bg-bone-100 py-12 sm:py-16 lg:py-20">
        <Container className="space-y-14 sm:space-y-16 lg:space-y-20">
          {sections.map((section) => (
            <Fragment key={section.id}>
              <MenuSection section={section} />
              {section.slug === flavours.afterCategorySlug && <FlavourGuide flavours={flavours} />}
            </Fragment>
          ))}
          {content.footnote && <p className="text-sm text-ink-500">{content.footnote}</p>}
        </Container>
      </div>

      <JsonLd data={menuSchema} />
      <JsonLd
        data={buildWebPageSchema({
          type: "CollectionPage",
          name: seo.title,
          description: seo.description,
          path: PAGE_PATHS.menu,
        })}
      />
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "Home", path: PAGE_PATHS.home },
          { name: "Menu", path: PAGE_PATHS.menu },
        ])}
      />
    </>
  );
}
