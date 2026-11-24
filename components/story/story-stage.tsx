import Image from "next/image";
import type { CSSProperties } from "react";
import { FoodImage } from "@/components/ui/food-image";
import type { MediaImage } from "@/types";
import { LandFx } from "./land-fx";
import { StoryScenes } from "./story-scenes";

/** Sets custom properties from data, so the CSS can do the maths. */
const vars = (values: Record<string, string | number>) => values as CSSProperties;

/* ---------------------------------------------------------------------------------------------
   Positions below are % of the round picture (x across, y down) and distances are in stage widths
   (1 = 1% of the plate's width), so the same artwork works at any size. They were read off the four
   photos: the sieve in the dusting photo, the wings in the basket, the mouth of the bowl and the
   bitten wing. The movement itself lives in app/story.css and story-controller.tsx.
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

/** Sauce flung up around the mouth of the bowl as the wings are tossed. */
const DROPS = [
  { x: 44, y: 46, dx: -26, up: 24, g: 40, sz: 1.8 },
  { x: 48, y: 44, dx: -16, up: 32, g: 46, sz: 1.3 },
  { x: 52, y: 46, dx: -6, up: 36, g: 48, sz: 2.2 },
  { x: 56, y: 44, dx: 6, up: 34, g: 46, sz: 1.5 },
  { x: 60, y: 47, dx: 16, up: 28, g: 42, sz: 1.9 },
  { x: 64, y: 49, dx: 26, up: 20, g: 38, sz: 1.2 },
  { x: 41, y: 50, dx: -32, up: 14, g: 34, sz: 1.1 },
  { x: 67, y: 51, dx: 31, up: 12, g: 32, sz: 1.4 },
  { x: 50, y: 42, dx: -10, up: 38, g: 50, sz: 1 },
  { x: 58, y: 42, dx: 11, up: 38, g: 50, sz: 1.2 },
  { x: 46, y: 48, dx: -20, up: 22, g: 38, sz: 0.9 },
  { x: 62, y: 45, dx: 22, up: 24, g: 40, sz: 1 },
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

/*
  The two wings of the first screen. They are the same two wings as in the full-screen opening (cut out of
  one photograph, lit from the upper left). x and y are where the middle of each one comes to rest, in
  stage widths from the centre of the plate; w is its width and r how it lies (degrees). sx and spin say
  where it lets go and how far it has turned by then. The timing is in app/story.css, and the crumbs
  that jump out at the touchdown are in land-sim.ts: change one, change the other.
*/
const WINGS = [
  { id: "a", src: "/images/intro/wing-a.webp", width: 370, height: 327, x: -17, y: -2, w: 45, r: -35, sx: -8, spin: -34 },
  { id: "b", src: "/images/intro/wing-b.webp", width: 385, height: 462, x: 16, y: 4, w: 38, r: -57, sx: 9, spin: 40 },
] as const;

/** Three slow wisps of steam over the wings once they have landed. x and y are from the centre. */
const STEAM = [
  { x: -19, y: -17, d: 0 },
  { x: 1, y: -21, d: 1.3 },
  { x: 20, y: -19, d: 2.5 },
];

/**
 * The plate that follows the visitor down the home page. On the first screen it is a wide black board,
 * lying on the table and tilted towards the visitor, and the two wings from the opening land on it in a
 * burst of crumbs. As the visitor scrolls it stands up and turns round into a window onto the kitchen
 * photos, one after another (dusting, cooking, tossing, biting). The hero photo is the first picture in
 * that window, so the dish arrives as the plate rises. The effects on top (spice, steam, sauce, crumbs)
 * are decoration, hidden from assistive technology; the captions beside it say what is going on.
 *
 * The scroll controller writes each number only onto the element that uses it (the data-scope
 * attributes below), so a change never makes the browser re-check the whole stage.
 */
export function StoryStage({ image }: { image: MediaImage | null }) {
  return (
    <div className="story-stage" data-story-stage>
      <div className="story-glow" aria-hidden="true" />
      <div className="story-shadow" aria-hidden="true" data-scope="shadow" />

      <div className="story-plate" data-scope="tilt">
        <div className="story-board-shadow" aria-hidden="true" data-scope="bshadow" />
        <div className="story-rim" aria-hidden="true" data-scope="rim" />

        <div className="story-lens" data-lens data-scope="lens">
          <div className="scene scene-board" data-scope="board" aria-hidden="true">
            <Image
              className="board-top"
              src="/images/story/board.webp"
              alt=""
              width={1400}
              height={1004}
              unoptimized
              loading="eager"
              fetchPriority="high"
            />
            <i className="land-sauce land-sauce-a" />
            <i className="land-sauce land-sauce-b" />
            <i className="land-shade land-shade-a" />
            <i className="land-shade land-shade-b" />
          </div>

          <div className="scene scene-plate" data-scope="photo">
            {/* Not preloaded: it only shows once the plate stands up, so the board and the wings load first. */}
            <FoodImage image={image} icon="wings" sizes="(min-width: 1024px) 440px, 82vw" />
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

            <div className="fx-group" data-scope="drops">
              {DROPS.map((drop, i) => (
                <i
                  key={i}
                  className="drop"
                  style={vars({
                    "--x": drop.x,
                    "--y": drop.y,
                    "--dx": drop.dx,
                    "--up": drop.up,
                    "--g": drop.g,
                    "--sz": drop.sz,
                  })}
                />
              ))}
            </div>

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

      <div className="story-land" data-scope="land" aria-hidden="true">
        {STEAM.map((wisp, i) => (
          <i key={i} className="land-steam" style={vars({ "--x": wisp.x, "--y": wisp.y, "--d": `${wisp.d}s` })} />
        ))}
        {WINGS.map((wing) => (
          <div
            key={wing.id}
            className={`land-wing land-wing-${wing.id}`}
            style={vars({
              "--x": wing.x,
              "--y": wing.y,
              "--w": wing.w,
              "--r": wing.r,
              "--sx": wing.sx,
              "--spin": wing.spin,
            })}
          >
            <div className="land-wing-body">
              <Image src={wing.src} alt="" width={wing.width} height={wing.height} unoptimized loading="eager" />
            </div>
          </div>
        ))}
        <LandFx />
      </div>
    </div>
  );
}
