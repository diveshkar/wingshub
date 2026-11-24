import type { Metadata } from "next";
import { PageHero } from "@/components/sections/page-hero";
import { JsonLd } from "@/components/seo/json-ld";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { getContact, getPageContent, getPageSeo } from "@/lib/data";
import { PAGE_PATHS, buildPageMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbSchema, buildWebPageSchema } from "@/lib/seo/schema";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("privacy");
}

export default async function PrivacyPage() {
  const [content, contact, seo] = await Promise.all([
    getPageContent("privacy"),
    getContact(),
    getPageSeo("privacy"),
  ]);

  return (
    <>
      <PageHero title={content.hero.title} intro={content.hero.intro} />

      <Section tone="bone">
        <Container>
          <div className="max-w-2xl space-y-10">
            {content.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="font-display text-xl font-extrabold">{section.heading}</h2>
                <div className="mt-3 space-y-3 font-serif text-lg leading-relaxed text-ink-600">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
            <p className="font-serif text-lg">
              <a
                href={`mailto:${contact.email}`}
                className="underline decoration-1 underline-offset-4 hover:decoration-2"
              >
                {contact.email}
              </a>
            </p>
          </div>
        </Container>
      </Section>

      <JsonLd
        data={buildWebPageSchema({
          type: "WebPage",
          name: seo.title,
          description: seo.description,
          path: PAGE_PATHS.privacy,
        })}
      />
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "Home", path: PAGE_PATHS.home },
          { name: "Privacy policy", path: PAGE_PATHS.privacy },
        ])}
      />
    </>
  );
}
