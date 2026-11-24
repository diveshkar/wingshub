import Image from "next/image";
import type { CSSProperties } from "react";
import { LandFx } from "./land-fx";
import { STORY_PHOTO } from "./story-photos";

/** Sets custom properties from data, so the CSS can do the maths. */
const vars = (values: Record<string, string | number>) => values as CSSProperties;

/* ---------------------------------------------------------------------------------------------
   Positions below are % of the round picture (x across, y down) and distances are in stage widths
   (1 = 1% of the plate's width), so the same artwork works at any size. The spice was placed from the
   sieve in the dusting photo. The movement itself lives in app/story.css and story-controller.tsx.
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
 * burst of crumbs. As the visitor scrolls it stands up and turns round into a window onto one kitchen
 * photo (the wings being dusted), which fades in as the plate rises. The spice falling over it is
 * decoration, hidden from assistive technology; the captions beside it say what is going on.
 *
 * The scroll controller writes each number only onto the element that uses it (the data-scope
 * attributes below), so a change never makes the browser re-check the whole stage.
 */
export function StoryStage() {
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
            <Image
              src={STORY_PHOTO.src}
              alt={STORY_PHOTO.alt}
              fill
              sizes="(min-width: 1024px) 440px, 82vw"
              loading="eager"
              fetchPriority="low"
              className="object-cover"
            />
          </div>

          <div className="story-fx" aria-hidden="true">
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
