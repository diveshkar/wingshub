"use client";

import Image from "next/image";
import { useState } from "react";
import type { CSSProperties } from "react";
import { CLASH_BEADS, LIP_CLIP, RIM_BEADS, TOSS_BASE, TOSS_WINGS, wingBox } from "./toss-layers";
import type { Bead, TossWingId } from "./toss-layers";
import { useIdleReady } from "./use-idle-ready";

const SIZES = "(min-width: 1024px) 440px, 82vw";
/** The painted-out base and the two wings. The opening starts once all three have arrived. */
const PIECES = 3;

const vars = (values: Record<string, string | number>) => values as CSSProperties;

function Beads({ beads }: { beads: Bead[] }) {
  return beads.map((bead, index) => (
    <span
      key={index}
      className="bead"
      style={vars({
        "--x": bead.x,
        "--y": bead.y,
        "--dx": bead.dx,
        "--up": bead.up,
        "--down": bead.down,
        "--sz": bead.sz,
        "--at": bead.at,
      })}
    >
      <i />
    </span>
  ));
}

/** One wing, drawn twice: sharp, and with the blur of speed. The blurred copy fades in as it picks up pace. */
function FallingWing({ id, onLoad }: { id: TossWingId; onLoad: () => void }) {
  const box = wingBox(id);
  const picture = {
    src: TOSS_WINGS[id].src,
    width: box.width_px,
    height: box.height_px,
    unoptimized: true,
    loading: "eager" as const,
    fetchPriority: "low" as const,
  };

  return (
    <div
      className={`fall fall-${id}`}
      style={{ left: box.left, top: box.top, width: box.width, aspectRatio: box.aspectRatio }}
    >
      <div className="layer layer-sharp">
        <Image {...picture} alt="" onLoad={onLoad} />
      </div>
      <div className="layer layer-blur">
        <Image {...picture} alt="" />
      </div>
    </div>
  );
}

/**
 * The opening. The tossing photo is already on the plate; once the layers have arrived they replace it
 * without any visible change, and then the moment in the photo carries on: two wings that have just hit
 * each other recoil, sauce flies off, and both drop into the bowl. Nothing is pasted on top: the wings
 * are the photo's own, so light, colour and scale are already right.
 */
export function HeroLive() {
  const ready = useIdleReady();
  const [loaded, setLoaded] = useState(0);
  if (!ready) return null;

  const note = () => setLoaded((count) => count + 1);

  return (
    <div className="scene-live" data-live={loaded >= PIECES ? "" : undefined} aria-hidden="true">
      <svg className="live-defs" width="0" height="0" focusable="false">
        <filter id="fall-blur" x="-15%" y="-25%" width="130%" height="150%" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation="0.8 7" />
        </filter>
      </svg>

      <Image src={TOSS_BASE} alt="" fill sizes={SIZES} loading="eager" fetchPriority="low" onLoad={note} />

      <div className="air" style={{ clipPath: LIP_CLIP }}>
        <FallingWing id="w1" onLoad={note} />
        <FallingWing id="w2" onLoad={note} />
        <div className="beads">
          <Beads beads={CLASH_BEADS} />
          <Beads beads={RIM_BEADS} />
        </div>
      </div>
    </div>
  );
}
