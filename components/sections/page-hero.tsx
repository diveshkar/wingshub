import type { ReactNode } from "react";
import { Container } from "@/components/ui/container";

type PageHeroProps = {
  title: string;
  intro: string;
  children?: ReactNode;
  /** Optional decoration behind the text, positioned by the element itself. */
  art?: ReactNode;
};

/** Dark title band shared by the inner pages. Renders the page's single <h1>. */
export function PageHero({ title, intro, children, art }: PageHeroProps) {
  return (
    <section className="relative isolate overflow-hidden bg-ink-900 text-bone-50">
      {art}
      <Container className="relative py-12 sm:py-16 lg:py-20">
        <h1 className="text-h1 max-w-4xl">{title}</h1>
        <p className="mt-5 max-w-2xl font-serif text-lg leading-relaxed text-ink-300 sm:text-xl">
          {intro}
        </p>
        {children}
      </Container>
    </section>
  );
}
