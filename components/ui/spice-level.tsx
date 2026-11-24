import { Flame } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type SpiceLevelProps = {
  /** The "spicy level" printed on the menu, for example 6. */
  level: number;
  className?: string;
};

export function SpiceLevel({ level, className }: SpiceLevelProps) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1 rounded bg-flame-500/10 px-2 py-0.5 text-xs font-bold text-ember-600",
        className,
      )}
    >
      <Flame aria-hidden="true" className="size-3.5 fill-current" />
      Spicy level {level}
    </span>
  );
}
