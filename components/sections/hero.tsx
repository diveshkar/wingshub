import { Fragment } from "react";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { FoodImage } from "@/components/ui/food-image";
import { getPageContent, getPrimaryLocation, getRestaurant } from "@/lib/data";
import { cn } from "@/lib/utils/cn";
import { hasAddress } from "@/lib/utils/format";

export async function Hero() {
  const [{ hero }, restaurant, location] = await Promise.all([
    getPageContent("home"),
    getRestaurant(),
    getPrimaryLocation(),
  ]);

  const { locality, region } = location.address;
  const place = hasAddress(location.address) ? [locality, region].filter(Boolean).join(", ") : null;

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative isolate bg-ink-900 text-bone-50"
    >
      <div aria-hidden="true" className="hero-backdrop pointer-events-none absolute inset-0 -z-10" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-px bg-gradient-to-r from-transparent via-flame-500/70 to-transparent"
      />

      <Container className="grid grid-cols-1 items-center gap-8 pb-14 pt-10 sm:gap-10 sm:pb-16 sm:pt-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:py-20">
        <div>
          {place && (
            <p className="font-display text-sm font-bold uppercase tracking-[0.14em] text-ink-300">
              {place}
            </p>
          )}

          <h1 id="hero-heading" className="mt-3 text-hero">
            {hero.headline.map((line, index) => (
              <Fragment key={line}>
                <span className={cn("block", index === hero.headline.length - 1 && "text-flame-400")}>
                  {line}
                </span>{" "}
              </Fragment>
            ))}
          </h1>

          <p className="mt-5 max-w-md font-serif text-lg leading-relaxed text-ink-300 sm:text-xl">
            {hero.subheadline}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href={hero.primaryCta.href} size="lg">
              {hero.primaryCta.label}
            </ButtonLink>
            <ButtonLink href={hero.secondaryCta.href} size="lg" variant="outline-light">
              {hero.secondaryCta.label}
            </ButtonLink>
          </div>
        </div>

        <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-ink-800 shadow-[0_24px_60px_-24px_rgb(229_8_13/0.6)] ring-1 ring-flame-500/30 md:aspect-[16/9] lg:aspect-[4/5]">
          <FoodImage
            image={restaurant.media.hero}
            icon="wings"
            sizes="(min-width: 1024px) 520px, 100vw"
            preload
          />
        </div>
      </Container>
    </section>
  );
}
