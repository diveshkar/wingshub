import { MenuItemCard } from "@/components/menu/menu-item-card";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Section, SectionHeading } from "@/components/ui/section";
import { getFeaturedItems, getMenuCategories, getPageContent } from "@/lib/data";

export async function FeaturedItems() {
  const [content, items, categories] = await Promise.all([
    getPageContent("home"),
    getFeaturedItems(4),
    getMenuCategories(),
  ]);
  if (items.length === 0) return null;

  const { featured } = content;
  const iconFor = (categoryId: string) =>
    categories.find((category) => category.id === categoryId)?.icon ?? "default";

  return (
    <Section tone="sand" labelledBy="featured-heading">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
          <SectionHeading
            id="featured-heading"
            title={featured.title}
            description={featured.description}
          />
          <ButtonLink href={featured.cta.href} variant="outline-dark">
            {featured.cta.label}
          </ButtonLink>
        </div>

        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <li key={item.id}>
              <MenuItemCard
                item={item}
                icon={iconFor(item.categoryId)}
                layout="responsive"
                compactPrices
              />
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
