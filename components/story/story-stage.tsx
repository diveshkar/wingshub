import Image from "next/image";
import type { CSSProperties } from "react";
import { HeroLive } from "./hero-live";
import { StoryScenes } from "./story-scenes";
import { STORY_PHOTOS } from "./story-photos";

/** Sets custom properties from data, so the CSS can do the maths. */
const vars = (values: Record<string, string | number>) => values as CSSProperties;

/* ---------------------------------------------------------------------------------------------
   Positions below are % of the round picture (x across, y down) and distances are in stage widths
   (1 = 1% of the plate's width), so the same artwork works at any size. They were read off the
   photos: the sieve in the dusting photo, the wings in the basket and the bitten wing. The movement
   itself lives in app/story.css and story-controller.tsx.
   --------------------------------------------------------------------------------------------- */

/** Spice falling from the sieve onto the wings (the sieve is at about 45% across, 33% down). */
const SPICE_TONES = ["#e0451a", "#c42d0c", "#ff7f3a", "#f2a03d", "#a8240a"];
const SPICE = Array.from({ length: 34 }, (_, i) => ({
  x: 38 + ((i * 37) % 17) * 0.75 + (i % 3) * 0.6,
  y: 31 + ((i * 13) % 7),
  fall: 18 + ((i * 11) % 13) * 1.5,
  sz: 0.5 + ((i * 7) % 6) * 0.13,
  o: 0.55 + ((i * 5) % 5) * 0.11,
  sway: 1 + (i % 3),
  tone: SPICE_TONES[i % SPICE_TONES.length],
}));

/** Steam: above the wings in the basket, and above the bitten wing. d is a start delay in seconds. */
const WISPS = [
  { zone: "cook", x: 30, y: 36, w: 9, h: 20, rise: 22, sway: -3, d: 0 },
  { zone: "cook", x: 40, y: 33, w: 8, h: 18, rise: 24, sway: 2, d: 1.1 },
  { zone: "cook", x: 49, y: 35, w: 10, h: 22, rise: 26, sway: -2, d: 2.2 },
  { zone: "cook", x: 58, y: 34, w: 8, h: 18, rise: 22, sway: 3, d: 3.1 },
  { zone: "cook", x: 66, y: 37, w: 9, h: 20, rise: 20, sway: -2, d: 4 },
  { zone: "bite", x: 48, y: 30, w: 8, h: 20, rise: 22, sway: 2, d: 0.4 },
  { zone: "bite", x: 53, y: 27, w: 7, h: 18, rise: 24, sway: -3, d: 1.8 },
  { zone: "bite", x: 57, y: 29, w: 8, h: 20, rise: 20, sway: 2, d: 3 },
];

/** Crumbs from each bite, starting where that bite's edge ends up. Eight per bite. */
const CRUMB_ORIGINS = [
  { x: 38, y: 47, dx: -8 },
  { x: 48, y: 53, dx: 6 },
  { x: 50, y: 42, dx: 0 },
];
const CRUMB_TONES = ["#e8641c", "#ff8a3d", "#c4400c", "#f0a04a", "#a8300a"];
const CRUMBS = CRUMB_ORIGINS.map((origin, index) =>
  Array.from({ length: 8 }, (_, i) => {
    const t = i * 1.9 + index * 0.8;
    return {
      x: origin.x + Math.cos(t) * 5,
      y: origin.y + Math.sin(t) * 4,
      dx: origin.dx + ((i % 4) - 1.5) * 3.2,
      dy: -3 - (i % 4) * 1.4,
      g: 34 + ((i * 7) % 14),
      sz: 0.9 + ((i * 5) % 5) * 0.28,
      spin: (i % 2 ? -1 : 1) * (110 + i * 22),
      tone: CRUMB_TONES[i % CRUMB_TONES.length],
    };
  }),
);

/**
 * The plate that follows the visitor down the home page. It is a round window: it starts as the
 * tossing photo, where two wings meet in mid-air and drop into the bowl of sauce, then opens onto the
 * kitchen photos one after another (dusting, cooking, tossing, biting) as the visitor scrolls. The
 * effects on top (spice, steam, crumbs) are decoration, hidden from assistive technology; the captions
 * beside it say what is going on.
 *
 * The scroll controller writes each number only onto the element that uses it (the data-scope
 * attributes below), so a change never makes the browser re-check the whole stage.
 */
export function StoryStage() {
  const tossing = STORY_PHOTOS[2];

  return (
    <div className="story-stage" data-story-stage>
      <div className="story-glow" aria-hidden="true" />
      <div className="story-shadow" aria-hidden="true" />

      <div className="story-plate">
        <div className="story-rim" aria-hidden="true" />

        <div className="story-lens" data-lens>
          <div className="scene scene-hero">
            <Image
              src={tossing.src}
              alt={tossing.alt}
              fill
              sizes="(min-width: 1024px) 440px, 82vw"
              priority
              className="object-cover"
            />
            <HeroLive />
          </div>

          <StoryScenes />

          <div className="story-fx" aria-hidden="true">
            <div className="story-veil story-veil-steam" data-scope="veil" />
            <div className="story-veil story-veil-sauce" data-scope="flash" />

            <div className="fx-group" data-scope="specks">
              {SPICE.map((speck, i) => (
                <i
                  key={i}
                  className="speck"
                  style={vars({
                    "--x": speck.x.toFixed(1),
                    "--y": speck.y,
                    "--fall": speck.fall.toFixed(1),
                    "--sz": speck.sz.toFixed(2),
                    "--o": speck.o.toFixed(2),
                    "--sway": speck.sway,
                    "--tone": speck.tone,
                  })}
                />
              ))}
            </div>

            {(["cook", "bite"] as const).map((zone) => (
              <div key={zone} className="fx-group" data-scope={`steam-${zone}`}>
                {WISPS.filter((wisp) => wisp.zone === zone).map((wisp, i) => (
                  <i
                    key={i}
                    className={`wisp wisp-${zone}`}
                    style={vars({
                      "--x": wisp.x,
                      "--y": wisp.y,
                      "--w": wisp.w,
                      "--h": wisp.h,
                      "--rise": wisp.rise,
                      "--drift": wisp.sway,
                      "--d": `${wisp.d}s`,
                    })}
                  />
                ))}
              </div>
            ))}

            {CRUMBS.map((crumbs, bite) => (
              <div key={bite} className="fx-group" data-scope={`crumbs-${bite + 1}`}>
                {crumbs.map((crumb, i) => (
                  <i
                    key={i}
                    className="crumb"
                    style={vars({
                      "--x": crumb.x.toFixed(1),
                      "--y": crumb.y.toFixed(1),
                      "--dx": crumb.dx.toFixed(1),
                      "--dy": crumb.dy.toFixed(1),
                      "--g": crumb.g,
                      "--sz": crumb.sz.toFixed(2),
                      "--spin": crumb.spin,
                      "--tone": crumb.tone,
                    })}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
