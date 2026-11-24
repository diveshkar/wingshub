import { PriceLine } from "@/components/ui/price-line";
import { SpiceLevel } from "@/components/ui/spice-level";
import { formatPrice, getStartingPrice } from "@/lib/utils/format";
import type { MenuItem } from "@/types";

/** Text-only menu row, laid out like a printed menu: name, dotted leader, price, then the description. */
export function MenuListItem({ item }: { item: MenuItem }) {
  const sizes = item.prices.length > 1;
  const singleLabel = !sizes ? item.prices[0].label : null;
  const price = sizes
    ? `From ${formatPrice(getStartingPrice(item.prices))}`
    : formatPrice(item.prices[0].amount);

  return (
    <li className="border-b border-ink-900/10 py-5">
      <PriceLine
        label={<h3 className="font-display text-base font-bold leading-snug">{item.name}</h3>}
        price={price}
        priceClassName="text-base text-ember-600"
      />

      {item.description && (
        <p className="mt-1.5 max-w-[56ch] font-serif text-[0.9375rem] leading-relaxed text-ink-500">
          {item.description}
        </p>
      )}

      {singleLabel && <p className="mt-1 text-sm text-ink-500">{singleLabel}</p>}

      {sizes && (
        <ul aria-label="Sizes and prices" className="mt-3 flex flex-wrap gap-1.5">
          {item.prices.map((option) => (
            <li key={option.label ?? option.amount} className="rounded bg-bone-200 px-2.5 py-1 text-[0.8125rem]">
              <span className="text-ink-600">{option.label}</span>{" "}
              <span className="font-bold tabular-nums">{formatPrice(option.amount)}</span>
            </li>
          ))}
        </ul>
      )}

      {item.spiceLevel !== null && <SpiceLevel level={item.spiceLevel} className="mt-2.5" />}
    </li>
  );
}
