import type { Metadata } from "next";
import { PageHero } from "@/components/sections/page-hero";
import { VisitUs } from "@/components/sections/visit-us";
import { JsonLd } from "@/components/seo/json-ld";
import { Container } from "@/components/ui/container";
import { FoodImage } from "@/components/ui/food-image";
import { Section } from "@/components/ui/section";
import { getPageContent, getPageSeo, getRestaurant } from "@/lib/data";
import { PAGE_PATHS, buildPageMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbSchema, buildWebPageSchema } from "@/lib/seo/schema";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("about");
}

export default async function AboutPage() {
  const [content, restaurant, seo] = await Promise.all([
    getPageContent("about"),
    getRestaurant(),
    getPageSeo("about"),
  ]);

  return (
    <>
      <PageHero title={content.hero.title} intro={content.hero.intro} />

      <Section tone="bone">
        <Container className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="max-w-xl space-y-5 font-serif text-lg leading-relaxed text-ink-600">
            {content.story.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-ink-800">
            <FoodImage
              image={restaurant.media.about}
              icon="wings"
              sizes="(min-width: 1024px) 560px, 100vw"
            />
          </div>
        </Container>
      </Section>

      <VisitUs />

      <JsonLd
        data={buildWebPageSchema({
          type: "AboutPage",
          name: seo.title,
          description: seo.description,
          path: PAGE_PATHS.about,
        })}
      />
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "Home", path: PAGE_PATHS.home },
          { name: "About", path: PAGE_PATHS.about },
        ])}
      />
    </>
  );
}
