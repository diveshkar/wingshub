import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type Tone = "bone" | "sand" | "ink";

const tones: Record<Tone, string> = {
  bone: "bg-bone-100 text-ink-900",
  sand: "bg-bone-200 text-ink-900",
  ink: "bg-ink-900 text-bone-50",
};

type SectionProps = {
  tone?: Tone;
  id?: string;
  /** id of the heading that names this section, for assistive technology. */
  labelledBy?: string;
  className?: string;
  children: ReactNode;
};

/** Every page section shares the same vertical rhythm so the page reads evenly at any width. */
export function Section({ tone = "bone", id, labelledBy, className, children }: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cn("py-16 md:py-20 lg:py-24", tones[tone], className)}
    >
      {children}
    </section>
  );
}

type SectionHeadingProps = {
  title: string;
  description?: string | null;
  id?: string;
  onDark?: boolean;
  className?: string;
};

export function SectionHeading({ title, description, id, onDark = false, className }: SectionHeadingProps) {
  return (
    <div className={cn("max-w-2xl", className)}>
      <span aria-hidden="true" className="mb-4 block h-1 w-12 bg-flame-500" />
      <h2 id={id} className="text-h2">
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            "mt-4 font-serif text-lg leading-relaxed",
            onDark ? "text-ink-300" : "text-ink-500",
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
