import type { MenuSection as MenuSectionData } from "@/types";
import { MenuItemCard } from "./menu-item-card";
import { MenuListItem } from "./menu-list-item";

/**
 * Dishes with a photo become cards; the rest read as a plain menu list underneath.
 * When a photo is added to an item in the data it moves into the card grid on its own.
 */
export function MenuSection({ section }: { section: MenuSectionData }) {
  const withPhoto = section.items.filter((item) => item.image);
  const withoutPhoto = section.items.filter((item) => !item.image);

  return (
    <section id={section.slug} aria-labelledby={`${section.slug}-heading`}>
      <header className="border-b-2 border-ink-900 pb-4">
        <h2 id={`${section.slug}-heading`} className="text-h2">
          {section.name}
        </h2>
        <p className="mt-2 max-w-2xl font-serif text-lg text-ink-500">{section.description}</p>
      </header>

      {withPhoto.length > 0 && (
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {withPhoto.map((item) => (
            <li key={item.id}>
              <MenuItemCard item={item} icon={section.icon} layout="responsive" />
            </li>
          ))}
        </ul>
      )}

      {withoutPhoto.length > 0 && (
        <ul
          className={
            withPhoto.length > 0
              ? "mt-8 grid border-t border-ink-900/10 md:grid-cols-2 md:gap-x-14"
              : "mt-2 grid md:grid-cols-2 md:gap-x-14"
          }
        >
          {withoutPhoto.map((item) => (
            <MenuListItem key={item.id} item={item} />
          ))}
        </ul>
      )}
    </section>
  );
}
