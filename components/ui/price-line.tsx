import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type PriceLineProps = {
  label: ReactNode;
  price: ReactNode;
  className?: string;
  labelClassName?: string;
  priceClassName?: string;
};

/** A label and a price joined by a dotted leader, like a printed menu. Colours come from the parent. */
export function PriceLine({ label, price, className, labelClassName, priceClassName }: PriceLineProps) {
  return (
    <div className={cn("flex items-baseline gap-3", className)}>
      <span className={labelClassName}>{label}</span>
      <span aria-hidden="true" className="min-w-4 flex-1 border-b border-dotted border-current opacity-30" />
      <span className={cn("shrink-0 font-display font-bold tabular-nums", priceClassName)}>{price}</span>
    </div>
  );
}
