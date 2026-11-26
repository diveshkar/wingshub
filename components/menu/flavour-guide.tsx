import { FoodImage } from "@/components/ui/food-image";
import { SectionHeading } from "@/components/ui/section";
import { FLAVOURS_ANCHOR } from "@/lib/data";
import { countFlavours, pluralize } from "@/lib/utils/menu";
import type { WingFlavours } from "@/types";

/** The wing flavour guide: every flavour grouped by style. Anchored so the menu nav can jump to it. */
export function FlavourGuide({ flavours }: { flavours: WingFlavours }) {
  const total = countFlavours(flavours);

  return (
    <section
      id={FLAVOURS_ANCHOR}
      aria-labelledby={`${FLAVOURS_ANCHOR}-heading`}
      className="overflow-hidden rounded-xl bg-ink-900 text-bone-50"
    >
      <div className="grid grid-cols-1 items-center gap-8 p-6 sm:p-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12 lg:p-12">
        <div>
          <p className="mb-3 font-display text-sm font-bold uppercase tracking-[0.14em] text-flame-400">
            {pluralize(total, "flavour")}
          </p>
          <SectionHeading
            id={`${FLAVOURS_ANCHOR}-heading`}
            title={flavours.title}
            description={flavours.description}
            onDark
          />
        </div>

        {flavours.image && (
          // Rises into view like the dish photos (.reveal); the picture inside settles from a close-up as the
          // box scrolls past (.zoom-photo, see app/globals.css). The soft fade at the foot and the thin edge
          // line keep it calm on the dark card.
          <div className="reveal relative mx-auto aspect-[9/10] w-full max-w-sm overflow-hidden rounded-lg lg:max-w-none">
            <div className="zoom-photo absolute inset-0">
              <FoodImage
                image={flavours.image}
                icon="wings"
                sizes="(min-width: 1024px) 440px, 90vw"
                className="object-[50%_20%]"
              />
            </div>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-900/55 via-transparent to-transparent"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-bone-50/10"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 items-start gap-x-10 gap-y-8 border-t border-bone-50/10 p-6 sm:grid-cols-2 sm:p-8 lg:grid-cols-3 lg:p-12">
        {flavours.groups.map((group) => (
          <div key={group.id}>
            <h3 className="font-display text-sm font-bold uppercase tracking-[0.12em] text-flame-400">
              {group.name}
            </h3>
            <ul className="mt-3 flex flex-wrap gap-2">
              {group.flavours.map((flavour) => (
                <li
                  key={flavour}
                  className="rounded border border-bone-50/20 px-3 py-1.5 text-sm font-medium"
                >
                  {flavour}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
