import type { MenuPrice, WingFlavours } from "@/types";

export const pluralize = (count: number, singular: string, plural = `${singular}s`) =>
  `${count} ${count === 1 ? singular : plural}`;

export const countFlavours = (flavours: WingFlavours): number =>
  flavours.groups.reduce((total, group) => total + group.flavours.length, 0);

/** True when an item is sold in sizes, or its single price carries a label such as "1 lb · 1 flavour". */
export const hasPriceOptions = (prices: readonly MenuPrice[]): boolean =>
  prices.length > 1 || prices[0].label !== null;
