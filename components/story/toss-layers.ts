/**
 * The opening and the "tossed" step are built from the tossing photo itself, as layers:
 *   - toss-base: the photo with two airborne wings painted out of it
 *   - toss-w1 / toss-w2: those two wings, cut out on their own (w2 is a pair that touch)
 * Because the wings come out of the same photograph, their light, colour, sharpness and size already
 * match the scene, and when they are back in place the picture is the original photo again.
 *
 * Everything here is measured in pixels of the 1200 x 1200 photo, which fills the round window.
 */

export const TOSS_BASE = "/images/story/toss-base.webp";

export const TOSS_WINGS = {
  /** [left, top, right, bottom] of the cut-out inside the photo. */
  w1: { src: "/images/story/toss-w1.webp", box: [236, 21, 583, 438] },
  w2: { src: "/images/story/toss-w2.webp", box: [133, 179, 475, 580] },
} as const;

export type TossWingId = keyof typeof TOSS_WINGS;

/** Where a cut-out sits inside the window, as percentages, so it scales with the plate. */
export function wingBox(id: TossWingId) {
  const [left, top, right, bottom] = TOSS_WINGS[id].box;
  return {
    left: `${(left / 12).toFixed(3)}%`,
    top: `${(top / 12).toFixed(3)}%`,
    width: `${((right - left) / 12).toFixed(3)}%`,
    aspectRatio: `${right - left} / ${bottom - top}`,
    width_px: right - left,
    height_px: bottom - top,
  };
}

/**
 * Everything above the front rim of the steel bowl. Wings that fall below the rim are hidden by the
 * bowl, which is how they drop *into* it. The curve was traced from the photo.
 */
export const LIP_CLIP =
  "polygon(0% 0%, 100% 0%, 100% 63.1%, 96.67% 66.1%, 93.33% 68.7%, 90% 71%, 86.67% 72.9%, 83.33% 74.6%, 80% 76%, 76.67% 77.2%, 73.33% 78.2%, 70% 79.2%, 66.67% 79.9%, 63.33% 80.6%, 60% 81.2%, 56.67% 81.7%, 53.33% 82.1%, 50% 82.4%, 46.67% 82.6%, 43.33% 82.65%, 40% 82.6%, 36.67% 82.3%, 33.33% 81.9%, 30% 81.2%, 26.67% 80.2%, 23.33% 79%, 20% 77.3%, 16.67% 75.2%, 13.33% 72.6%, 10% 69.4%, 0% 69.4%)";

/**
 * Droplets of sauce. x and y are where each one starts, dx how far it drifts sideways, up how high it
 * is thrown first and down how far it ends up below its start (all in photo pixels), sz its diameter
 * and at the time it is thrown, in milliseconds after the wings start to move.
 */
export type Bead = { x: number; y: number; dx: number; up: number; down: number; sz: number; at: number };

/** The two wings touch in the photo: that is the moment of the clash. Sauce flies from the contact point. */
export const CLASH_BEADS: Bead[] = [
  { x: 389, y: 314, dx: -130, up: 70, down: 270, sz: 17, at: 0 },
  { x: 392, y: 318, dx: -76, up: 128, down: 310, sz: 11, at: 20 },
  { x: 388, y: 312, dx: -22, up: 158, down: 340, sz: 21, at: 0 },
  { x: 392, y: 316, dx: 38, up: 136, down: 300, sz: 12, at: 30 },
  { x: 390, y: 314, dx: 96, up: 96, down: 262, sz: 18, at: 10 },
  { x: 388, y: 318, dx: 150, up: 62, down: 220, sz: 10, at: 40 },
  { x: 391, y: 312, dx: -158, up: 34, down: 210, sz: 9, at: 50 },
  { x: 390, y: 316, dx: 12, up: 74, down: 250, sz: 8, at: 60 },
  { x: 389, y: 313, dx: 72, up: 168, down: 330, sz: 14, at: 15 },
  { x: 392, y: 315, dx: -48, up: 104, down: 288, sz: 9, at: 70 },
  { x: 390, y: 317, dx: 118, up: 40, down: 196, sz: 8, at: 90 },
];

/** Sauce thrown up where the wings drop behind the front rim of the bowl. */
export const RIM_BEADS: Bead[] = [
  { x: 300, y: 972, dx: -34, up: 96, down: 96, sz: 11, at: 1360 },
  { x: 342, y: 980, dx: -12, up: 142, down: 142, sz: 16, at: 1390 },
  { x: 384, y: 984, dx: 22, up: 118, down: 118, sz: 9, at: 1410 },
  { x: 420, y: 984, dx: 44, up: 150, down: 150, sz: 14, at: 1440 },
  { x: 456, y: 982, dx: 70, up: 92, down: 92, sz: 10, at: 1470 },
  { x: 330, y: 978, dx: -52, up: 70, down: 70, sz: 8, at: 1500 },
  { x: 400, y: 984, dx: 8, up: 168, down: 168, sz: 12, at: 1530 },
  { x: 372, y: 982, dx: -26, up: 124, down: 124, sz: 8, at: 1580 },
  { x: 440, y: 984, dx: 30, up: 106, down: 106, sz: 9, at: 1620 },
];

/**
 * Sauce flung up as the wings climb back out of the bowl (scroll-driven). g is how far each drop has
 * fallen again by the end, so it drops back behind the rim.
 */
export type TossDrop = { x: number; y: number; dx: number; up: number; g: number; sz: number };

export const TOSS_DROPS: TossDrop[] = [
  { x: 300, y: 975, dx: -30, up: 220, g: 260, sz: 14 },
  { x: 340, y: 982, dx: -10, up: 300, g: 330, sz: 20 },
  { x: 380, y: 985, dx: 18, up: 260, g: 300, sz: 11 },
  { x: 420, y: 985, dx: 40, up: 330, g: 360, sz: 17 },
  { x: 460, y: 984, dx: 64, up: 240, g: 280, sz: 12 },
  { x: 320, y: 980, dx: -54, up: 180, g: 210, sz: 9 },
  { x: 400, y: 985, dx: 6, up: 370, g: 400, sz: 13 },
  { x: 360, y: 983, dx: -24, up: 290, g: 320, sz: 9 },
  { x: 440, y: 985, dx: 28, up: 210, g: 240, sz: 10 },
  { x: 500, y: 982, dx: 80, up: 200, g: 230, sz: 9 },
  { x: 270, y: 970, dx: -70, up: 150, g: 180, sz: 8 },
  { x: 480, y: 984, dx: 52, up: 270, g: 300, sz: 15 },
];
