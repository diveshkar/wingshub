import { siteConfig } from "@/config/site";
import type { DayOfWeek, Location, MenuPrice, OpeningHoursEntry, PostalAddress } from "@/types";

const priceFormatter = new Intl.NumberFormat(siteConfig.locale, {
  style: "currency",
  currency: siteConfig.currency,
});

export const formatPrice = (amount: number) => priceFormatter.format(amount);

export const getStartingPrice = (prices: readonly MenuPrice[]) =>
  Math.min(...prices.map((price) => price.amount));

/** Formats a North American E.164 number for display; other numbers are returned unchanged. */
export function formatPhone(e164: string): string {
  const match = /^\+1(\d{3})(\d{3})(\d{4})$/.exec(e164);
  return match ? `(${match[1]}) ${match[2]}-${match[3]}` : e164;
}

/** An address is only worth showing (or mapping) once it has at least a street and a city. */
export function hasAddress(address: PostalAddress): boolean {
  return Boolean(address.streetAddress && address.locality);
}

export function formatAddressLines(address: PostalAddress): string[] {
  const cityLine = [address.locality, address.region].filter(Boolean).join(", ");
  return [address.streetAddress, [cityLine, address.postalCode].filter(Boolean).join(" ")].filter(
    (line): line is string => Boolean(line),
  );
}

export const formatAddressOneLine = (address: PostalAddress) =>
  formatAddressLines(address).join(", ");

/** Prefers the owner-supplied Maps link, otherwise builds a search link from the address. */
export function getDirectionsUrl(location: Location): string | null {
  if (location.mapsUrl) return location.mapsUrl;
  if (!hasAddress(location.address)) return null;
  const query = encodeURIComponent(formatAddressOneLine(location.address));
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

/** "13:30" -> "1:30 p.m." (Canadian English). Midnight is written out so it cannot be misread. */
export function formatTime(time24: string): string {
  const [hours, minutes] = time24.split(":").map(Number);
  if (hours === 0 && minutes === 0) return "midnight";
  const suffix = hours >= 12 ? "p.m." : "a.m.";
  const hour12 = hours % 12 || 12;
  return minutes === 0
    ? `${hour12} ${suffix}`
    : `${hour12}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

export const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

export function formatHoursEntry(entry: OpeningHoursEntry): string {
  if (entry.status === "closed") return "Closed";
  if (entry.status === "open" && entry.opens && entry.closes) {
    return `${formatTime(entry.opens)} – ${formatTime(entry.closes)}`;
  }
  return "To be announced";
}

export const hasConfirmedHours = (rows: readonly OpeningHoursEntry[]) =>
  rows.some((row) => row.status !== "tba");

/** Merges neighbouring days that share the same hours: "Every day", "Monday – Friday", "Saturday". */
export function groupOpeningHours(
  rows: readonly OpeningHoursEntry[],
): { label: string; hours: string }[] {
  const groups: { first: DayOfWeek; last: DayOfWeek; hours: string; days: number }[] = [];

  for (const row of rows) {
    const hours = formatHoursEntry(row);
    const previous = groups[groups.length - 1];
    if (previous && previous.hours === hours) {
      previous.last = row.day;
      previous.days += 1;
    } else {
      groups.push({ first: row.day, last: row.day, hours, days: 1 });
    }
  }

  return groups.map(({ first, last, hours, days }) => ({
    label:
      days === 7
        ? "Every day"
        : days === 1
          ? DAY_LABELS[first]
          : `${DAY_LABELS[first]} – ${DAY_LABELS[last]}`,
    hours,
  }));
}

/** Public image paths are served as-is; absolute URLs are left untouched. */
export const toAbsoluteUrl = (src: string, origin: string) =>
  src.startsWith("http") ? src : `${origin}${src}`;
