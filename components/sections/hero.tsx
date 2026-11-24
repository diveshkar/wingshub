import { Fragment } from "react";
import type { CSSProperties } from "react";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { StoryController } from "@/components/story/story-controller";
import { StoryStage } from "@/components/story/story-stage";
import { getPageContent, getPrimaryLocation } from "@/lib/data";
import { cn } from "@/lib/utils/cn";
import { hasAddress } from "@/lib/utils/format";

/** Start time of an entrance animation, in milliseconds. */
const delay = (ms: number) => ({ "--delay": `${ms}ms` }) as CSSProperties;

/**
 * The top of the home page. The headline is the first thing you read; the plate beside it is where
 * two wings clash and drop, and then follows you down while the captions explain how a wing is
 * made. See app/story.css for the layout and components/story for the pieces.
 */
export async function Hero() {
  const [{ hero, story }, location] = await Promise.all([
    getPageContent("home"),
    getPrimaryLocation(),
  ]);

  const { locality, region } = location.address;
  const place = hasAddress(location.address) ? [locality, region].filter(Boolean).join(", ") : null;

  return (
    <section
      aria-labelledby="hero-heading"
      data-story
      data-intro="wait"
      data-step="-1"
      className="relative isolate overflow-clip bg-ink-900 text-bone-50"
    >
      <div aria-hidden="true" className="hero-backdrop pointer-events-none absolute inset-0 -z-10" />

      <Container className="story-grid pb-16 pt-10 sm:pt-14 lg:py-20">
        <div className="story-intro">
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

        <div className="story-sticky">
          <StoryStage />
        </div>

        <div className="story-track" data-story-track>
          <div className="story-captions" data-story-captions>
            {story.steps.map((step) => (
              <div key={step.title} className="story-caption">
                <span aria-hidden="true" className="mb-4 block h-1 w-12 bg-flame-500" />
                <h2 className="font-display text-[clamp(1.9rem,1.1rem+3.2vw,3.4rem)] font-black uppercase leading-[1.02]">
                  {step.title}
                </h2>
                <p className="mt-4 max-w-md font-serif text-lg leading-relaxed text-ink-300 sm:text-xl">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Container>

      <StoryController />
    </section>
  );
}
