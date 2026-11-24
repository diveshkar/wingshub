import { Fragment } from "react";
import type { CSSProperties } from "react";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { FloatingWing } from "@/components/ui/floating-wing";
import { FoodImage } from "@/components/ui/food-image";
import { getPageContent, getPrimaryLocation, getRestaurant } from "@/lib/data";
import { cn } from "@/lib/utils/cn";
import { hasAddress } from "@/lib/utils/format";

/** Start time of an entrance animation, in milliseconds. */
const delay = (ms: number) => ({ "--delay": `${ms}ms` }) as CSSProperties;

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
      className="relative isolate overflow-x-clip bg-ink-900 text-bone-50"
    >
      <div aria-hidden="true" className="hero-backdrop pointer-events-none absolute inset-0 -z-10" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-px bg-gradient-to-r from-transparent via-flame-500/70 to-transparent"
      />

      <Container className="grid grid-cols-1 items-center gap-8 pb-14 pt-10 sm:gap-10 sm:pb-16 sm:pt-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:py-20">
        <div>
          {place && (
            <p
              className="rise-in font-display text-sm font-bold uppercase tracking-[0.14em] text-ink-300"
              style={delay(0)}
            >
              {place}
            </p>
          )}

          <h1 id="hero-heading" className="mt-3 text-hero">
            {hero.headline.map((line, index) => (
              <Fragment key={line}>
                <span
                  className={cn(
                    "rise-in block",
                    index === hero.headline.length - 1 && "text-flame-400",
                  )}
                  style={delay(80 + index * 90)}
                >
                  {line}
                </span>{" "}
              </Fragment>
            ))}
          </h1>

          <p
            className="rise-in mt-5 max-w-md font-serif text-lg leading-relaxed text-ink-300 sm:text-xl"
            style={delay(280)}
          >
            {hero.subheadline}
          </p>

          <div className="rise-in mt-8 flex flex-wrap gap-3" style={delay(360)}>
            <ButtonLink href={hero.primaryCta.href} size="lg">
              {hero.primaryCta.label}
            </ButtonLink>
            <ButtonLink href={hero.secondaryCta.href} size="lg" variant="outline-light">
              {hero.secondaryCta.label}
            </ButtonLink>
          </div>
        </div>

        <div className="relative">
          <div className="hero-photo relative aspect-[4/3] overflow-hidden rounded-xl bg-ink-800 shadow-[0_24px_60px_-24px_rgb(229_8_13/0.6)] ring-1 ring-flame-500/30 md:aspect-[16/9] lg:aspect-[4/5]">
            <FoodImage
              image={restaurant.media.hero}
              icon="wings"
              sizes="(min-width: 1024px) 520px, 100vw"
              preload
            />
          </div>

          <FloatingWing
            src="/images/animation/wing-drip.webp"
            width={459}
            height={478}
            sizes="(min-width: 1024px) 200px, (min-width: 768px) 130px, 100px"
            tilt={-8}
            delay={0.5}
            duration={7}
            className="-right-1 -top-6 w-[28%] md:-top-8 md:right-2 md:w-[17%] lg:-right-[8%] lg:-top-[8%] lg:w-[42%]"
          />
          <FloatingWing
            src="/images/animation/wings-splash.webp"
            width={510}
            height={352}
            sizes="(min-width: 1024px) 260px, (min-width: 768px) 160px, 130px"
            tilt={9}
            delay={0.8}
            duration={8.5}
            className="-bottom-5 -left-1 w-[36%] md:-bottom-6 md:left-0 md:w-[22%] lg:-bottom-[4%] lg:-left-[14%] lg:w-[54%]"
          />
        </div>
      </Container>
    </section>
  );
}
