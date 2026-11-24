import { groupOpeningHours, hasConfirmedHours } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { OpeningHoursEntry } from "@/types";

type OpeningHoursProps = {
  rows: OpeningHoursEntry[];
  className?: string;
  /** Extra classes for the "to be announced" sentence only, so each place can match its surrounding text. */
  emptyClassName?: string;
};

/** Inherits the surrounding text colour so it works on light and dark surfaces. */
export function OpeningHours({ rows, className, emptyClassName }: OpeningHoursProps) {
  if (!hasConfirmedHours(rows)) {
    return <p className={cn(className, emptyClassName)}>Opening hours will be announced soon.</p>;
  }

  return (
    <dl className={cn("grid w-fit max-w-sm gap-2 text-[0.9375rem]", className)}>
      {groupOpeningHours(rows).map((group) => (
        <div
          key={group.label}
          className="flex items-baseline justify-between gap-6 border-b border-current/10 pb-2 last:border-0 last:pb-0"
        >
          <dt className="font-semibold">{group.label}</dt>
          <dd className="tabular-nums">{group.hours}</dd>
        </div>
      ))}
    </dl>
  );
}
