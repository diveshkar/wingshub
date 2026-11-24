import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { PriceLine } from "@/components/ui/price-line";
import { Section, SectionHeading } from "@/components/ui/section";
import { getMenuItemsBySlugs, getPageContent } from "@/lib/data";
import { formatPrice } from "@/lib/utils/format";

/** Explains how wings are sold. The price table is read from the menu items, so it never goes out of date. */
export async function WingsGuide() {
  const { wingsGuide } = await getPageContent("home");
  const items = await getMenuItemsBySlugs(wingsGuide.itemSlugs);

  return (
    <Section tone="bone" labelledBy="wings-guide-heading">
      <Container className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-start lg:gap-16">
        <div>
          <SectionHeading id="wings-guide-heading" title={wingsGuide.title} />
          <div className="mt-6 max-w-xl space-y-4 font-serif text-lg leading-relaxed text-ink-600">
            {wingsGuide.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <ButtonLink href={wingsGuide.link.href} variant="outline-dark" className="mt-8">
            {wingsGuide.link.label}
          </ButtonLink>
        </div>

        <div className="reveal space-y-8 rounded-xl bg-ink-900 p-6 text-bone-50 sm:p-8">
          {items.map((item) => (
            <div key={item.id}>
              <h3 className="font-display text-sm font-bold uppercase tracking-[0.12em] text-flame-400">
                {item.name}
              </h3>
              <ul className="mt-2 divide-y divide-bone-50/10">
                {item.prices.map((price) => (
                  <li key={price.label ?? price.amount} className="py-3">
                    <PriceLine
                      label={price.label ?? item.name}
                      price={formatPrice(price.amount)}
                      labelClassName="text-[0.9375rem]"
                      priceClassName="text-base"
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
