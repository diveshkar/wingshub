import { FoodImage } from "@/components/ui/food-image";
import { SpiceLevel } from "@/components/ui/spice-level";
import { cn } from "@/lib/utils/cn";
import { formatPrice, getStartingPrice } from "@/lib/utils/format";
import { hasPriceOptions } from "@/lib/utils/menu";
import type { CategoryIcon, MenuItem } from "@/types";

type MenuItemCardProps = {
  item: MenuItem;
  /** Category icon, used only if the photo is missing. */
  icon?: CategoryIcon;
  /**
   * "stacked" is always vertical.
   * "responsive" is a compact row on phones and a vertical card from `sm` up.
   */
  layout?: "stacked" | "responsive";
  /** Show "From $x" instead of listing every size, for teaser grids. */
  compactPrices?: boolean;
};

const SIZES: Record<NonNullable<MenuItemCardProps["layout"]>, string> = {
  stacked: "(min-width: 1024px) 280px, (min-width: 640px) 45vw, 100vw",
  responsive: "(min-width: 1024px) 380px, (min-width: 640px) 45vw, 112px",
};

const priceText = "font-display text-lg font-extrabold tabular-nums text-ember-600";

/** Photo card for a dish. Items without a photo use MenuListItem instead. */
export function MenuItemCard({
  item,
  icon,
  layout = "stacked",
  compactPrices = false,
}: MenuItemCardProps) {
  const responsive = layout === "responsive";
  const options = hasPriceOptions(item.prices);
  const showChips = options && !compactPrices;

  return (
    <article
      className={cn(
        "flex h-full overflow-hidden rounded-xl border border-ink-900/10 bg-bone-50",
        responsive ? "flex-row sm:flex-col" : "flex-col",
      )}
    >
      <div
        className={cn(
          "relative shrink-0 bg-ink-800",
          responsive ? "w-28 sm:aspect-[4/3] sm:w-auto" : "aspect-[4/3]",
        )}
      >
        <FoodImage image={item.image} icon={icon} sizes={SIZES[layout]} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
        <h3 className="font-display text-base font-bold leading-snug sm:text-lg">{item.name}</h3>

        {item.description && (
          <p className="mt-1.5 font-serif text-[0.9375rem] leading-relaxed text-ink-500">
            {item.description}
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pt-4">
          {showChips ? (
            <ul aria-label="Sizes and prices" className="flex flex-wrap gap-1.5">
              {item.prices.map((price) => (
                <li
                  key={price.label ?? price.amount}
                  className="rounded bg-bone-200 px-2.5 py-1 text-[0.8125rem]"
                >
                  <span className="text-ink-600">{price.label}</span>{" "}
                  <span className="font-bold tabular-nums">{formatPrice(price.amount)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className={priceText}>
              {options && <span className="mr-1 text-sm font-semibold text-ink-500">From</span>}
              {formatPrice(options ? getStartingPrice(item.prices) : item.prices[0].amount)}
            </p>
          )}

          {item.spiceLevel !== null && <SpiceLevel level={item.spiceLevel} />}
        </div>
      </div>
    </article>
  );
}
