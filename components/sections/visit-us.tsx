import { LocationMap } from "@/components/contact/location-map";
import { BiteEdge } from "@/components/story/bite-edge";
import { Container } from "@/components/ui/container";
import { Section, SectionHeading } from "@/components/ui/section";
import { getPageContent, getPrimaryLocation } from "@/lib/data";
import { VisitDetails } from "./visit-details";

export async function VisitUs() {
  const [{ visit }, location] = await Promise.all([getPageContent("home"), getPrimaryLocation()]);

  return (
    <Section tone="ink" labelledBy="visit-heading" className="relative">
      <BiteEdge />
      <Container className="grid grid-cols-1 gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div>
          <SectionHeading
            id="visit-heading"
            title={visit.title}
            description={visit.description}
            onDark
          />
          <VisitDetails tone="dark" className="mt-8" />
        </div>
        <LocationMap location={location} className="aspect-[4/3] lg:aspect-auto lg:min-h-[26rem]" />
      </Container>
    </Section>
  );
}
