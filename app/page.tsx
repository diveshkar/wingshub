import type { Metadata } from "next";
import { FaqSection } from "@/components/sections/faq-section";
import { FeaturedItems } from "@/components/sections/featured-items";
import { Hero } from "@/components/sections/hero";
import { VisitUs } from "@/components/sections/visit-us";
import { WingsGuide } from "@/components/sections/wings-guide";
import { JsonLd } from "@/components/seo/json-ld";
import { IntroSplash } from "@/components/story/intro-splash";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { buildFaqSchema } from "@/lib/seo/schema";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("home");
}

export default async function HomePage() {
  const faqSchema = await buildFaqSchema();

  return (
    <>
      <IntroSplash />
      <Hero />
      <WingsGuide />
      <FeaturedItems />
      <VisitUs />
      <FaqSection />
      <JsonLd data={faqSchema} />
    </>
  );
}
