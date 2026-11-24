import {
  Beef,
  CupSoda,
  Droplets,
  Drumstick,
  IceCreamCone,
  Package,
  Pizza,
  Popcorn,
  Sandwich,
  Utensils,
  UtensilsCrossed,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";
import type { CategoryIcon } from "@/types";

const icons: Record<CategoryIcon, LucideIcon> = {
  wings: Drumstick,
  boneless: Beef,
  appetizers: Utensils,
  fries: Popcorn,
  wraps: Sandwich,
  quesadillas: Pizza,
  combos: Package,
  extras: Droplets,
  drinks: CupSoda,
  desserts: IceCreamCone,
  default: UtensilsCrossed,
};

type CategoryGlyphProps = LucideProps & { icon: CategoryIcon };

/** Maps the `icon` key stored in menu-categories.json to a drawn icon. */
export function CategoryGlyph({ icon, ...props }: CategoryGlyphProps) {
  const Glyph = icons[icon];
  return <Glyph aria-hidden="true" {...props} />;
}
