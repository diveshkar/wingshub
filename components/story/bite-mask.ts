import type { CSSProperties } from "react";

/*
 * The bites that eat the "tossing" photo away to show the "biting" photo underneath.
 * Each bite is one big round hole plus a row of small ones along its edge: the tooth marks.
 *
 * Positions are % of the picture (the round lens, 92 stage widths across). Sizes are in stage
 * widths (cqw). `teeth` are the angles, in degrees from "right" going clockwise, along the edge that
 * faces the middle of the picture, which is where the teeth would have been.
 */
const LENS = 92;

const BITES = [
  { x: -4, y: 38, r: 40, teeth: [-28, -8, 12, 32, 52] },
  { x: 80, y: 12, r: 48, teeth: [88, 108, 128, 148, 168] },
  { x: 50, y: 96, r: 50, teeth: [-130, -110, -90, -70, -50] },
];

function hole(x: number, y: number, r: number, grow: string) {
  const edge = 0.14;
  return `radial-gradient(circle at ${x.toFixed(2)}% ${y.toFixed(2)}%, transparent calc(var(${grow}) * ${(r - edge).toFixed(2)}cqw), #000 calc(var(${grow}) * ${(r + edge).toFixed(2)}cqw))`;
}

const LAYERS = BITES.flatMap((bite, index) => {
  const grow = `--bite${index + 1}`;
  const cx = (bite.x / 100) * LENS;
  const cy = (bite.y / 100) * LENS;
  const layers = [hole(bite.x, bite.y, bite.r, grow)];

  for (const degrees of bite.teeth) {
    const angle = (degrees * Math.PI) / 180;
    const tx = cx + Math.cos(angle) * bite.r * 0.93;
    const ty = cy + Math.sin(angle) * bite.r * 0.93;
    layers.push(hole((tx / LENS) * 100, (ty / LENS) * 100, bite.r * 0.2, grow));
  }
  return layers;
}).join(", ");

/** Put this on the element that should be eaten. --bite1 to --bite3 (0 to 1) grow each bite. */
export const BITE_STYLE: CSSProperties = {
  WebkitMaskImage: LAYERS,
  maskImage: LAYERS,
  WebkitMaskComposite: "source-in",
  maskComposite: "intersect",
};
