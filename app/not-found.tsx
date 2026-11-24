import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <section className="bg-ink-900 text-bone-50">
      <Container className="py-20 sm:py-28 lg:py-32">
        <p className="font-display text-sm font-bold uppercase tracking-[0.14em] text-flame-400">
          Error 404
        </p>
        <h1 className="mt-3 text-h1">Page not found</h1>
        <p className="mt-5 max-w-lg font-serif text-lg leading-relaxed text-ink-300 sm:text-xl">
          The page you are looking for does not exist or has moved. Try the menu, or head back to the
          home page.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/menu" size="lg">
            See the menu
          </ButtonLink>
          <ButtonLink href="/" size="lg" variant="outline-light">
            Home page
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
