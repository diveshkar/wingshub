import type { Metadata } from "next";
import { ContactForm } from "@/components/contact/contact-form";
import { LocationMap } from "@/components/contact/location-map";
import { PageHero } from "@/components/sections/page-hero";
import { VisitDetails } from "@/components/sections/visit-details";
import { JsonLd } from "@/components/seo/json-ld";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { siteConfig } from "@/config/site";
import { getContact, getPageContent, getPageSeo, getPrimaryLocation } from "@/lib/data";
import { PAGE_PATHS, buildPageMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbSchema, buildWebPageSchema } from "@/lib/seo/schema";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("contact");
}

export default async function ContactPage() {
  const [content, contact, location, seo] = await Promise.all([
    getPageContent("contact"),
    getContact(),
    getPrimaryLocation(),
    getPageSeo("contact"),
  ]);

  return (
    <>
      <PageHero title={content.hero.title} intro={content.hero.intro} />

      <Section tone="bone" labelledBy="visit-heading" className="py-12 sm:py-16 lg:py-20">
        <Container className="grid grid-cols-1 gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start lg:gap-16">
          <div className="order-2 lg:order-1">
            <ContactForm
              formName={siteConfig.contactForm.name}
              endpoint={siteConfig.contactForm.endpoint}
              fallbackEmail={contact.email}
              copy={content.form}
            />
          </div>

          <div className="order-1 lg:order-2">
            <h2 id="visit-heading" className="text-h2">
              {content.visit.title}
            </h2>
            {content.visit.description && (
              <p className="mt-2 font-serif text-lg text-ink-500">{content.visit.description}</p>
            )}
            <VisitDetails className="mt-6" />
            <LocationMap location={location} className="mt-8 aspect-[4/3]" />
          </div>
        </Container>
      </Section>

      <JsonLd
        data={buildWebPageSchema({
          type: "ContactPage",
          name: seo.title,
          description: seo.description,
          path: PAGE_PATHS.contact,
        })}
      />
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "Home", path: PAGE_PATHS.home },
          { name: "Contact", path: PAGE_PATHS.contact },
        ])}
      />
    </>
  );
}
