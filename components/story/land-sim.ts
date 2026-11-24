/**
 * The crumbs and the flecks of sauce that jump out when the two wings land on the board.
 *
 * It is a small physics model with no page in it, so the same code can play the landing live (land-fx.tsx
 * steps it along with the clock) or jump straight to the end for a visitor who should see the finished
 * board. Every number comes from one fixed random sequence and a fixed time step, so both give the same
 * crumbs in the same places.
 *
 * Units: distances are in stage widths (1 = the whole width of the plate's square), measured from its
 * centre, x to the right and y down the screen. A bit lies on the board at (x, y) and may be z above it;
 * on screen it is drawn at (x, y - z). Time is in seconds from the moment the first wing is let go.
 */

/** The two touchdowns. They match the wings' CSS (--dur and --delay-a / --delay-b in app/story.css: 46 % of 1.9 s after each delay). */
export const IMPACTS = [
  { t: 0.994, x: -0.17, y: 0.025 },
  { t: 1.174, x: 0.16, y: 0.075 },
] as const;

const STEP = 1 / 120;
/** Gravity, in stage widths per second squared: a slowed-down fall, so the eye can follow each crumb. */
const G = 3.1;

type Bit = {
  /** A fleck of sauce rather than a crumb. */
  sauce: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  /** Size, in stage widths. */
  r: number;
  rot: number;
  spin: number;
  tone: number;
  /** Radius of each corner of the crumb, so no two have the same outline. */
  shape: number[];
  hops: number;
  rest: boolean;
};

export type Sim = {
  t: number;
  bits: Bit[];
  next: number;
  random: () => number;
};

export type View = {
  /** The canvas, in pixels. */
  width: number;
  height: number;
  /** Pixels in one stage width. */
  unit: number;
};

/** Golden-brown breading: [body, lit edge]. The first colours are the most common. */
const CRUMBS = [
  ["#c9731d", "#f2aa52"],
  ["#b3561a", "#e58a3b"],
  ["#d99a3a", "#f7d283"],
  ["#c9731d", "#f2aa52"],
  ["#8f3d12", "#cf6f2d"],
  ["#e7b45a", "#fbe6ad"],
] as const;

/** A small, repeatable random sequence (mulberry32). */
function sequence(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createSim(): Sim {
  return { t: 0, bits: [], next: 0, random: sequence(20240611) };
}

/** Throw the crumbs and sauce out of one touchdown: a fan that is mostly low and wide, a few flying far. */
function burst(sim: Sim, at: (typeof IMPACTS)[number]) {
  const random = sim.random;

  for (let i = 0; i < 46; i++) {
    const angle = random() * Math.PI * 2;
    const speed = 0.1 + Math.pow(random(), 1.6) * 0.85;
    const big = random() < 0.12;
    sim.bits.push({
      sauce: false,
      x: at.x + (random() - 0.5) * 0.07,
      y: at.y + (random() - 0.5) * 0.03,
      z: 0.015 + random() * 0.05,
      vx: Math.cos(angle) * speed,
      // the board runs away from us, so sideways-and-deep throws look shorter than they are
      vy: Math.sin(angle) * speed * 0.48,
      vz: 0.5 + random() * 0.95,
      r: (big ? 0.0105 : 0.0042) + random() * (big ? 0.005 : 0.0062),
      rot: random() * Math.PI * 2,
      spin: (random() - 0.5) * 22,
      tone: Math.floor(random() * CRUMBS.length),
      shape: Array.from({ length: 6 }, () => 0.62 + random() * 0.55),
      hops: 0,
      rest: false,
    });
  }

  for (let i = 0; i < 11; i++) {
    const angle = random() * Math.PI * 2;
    const speed = 0.16 + random() * 0.72;
    sim.bits.push({
      sauce: true,
      x: at.x + (random() - 0.5) * 0.06,
      y: at.y + (random() - 0.5) * 0.03,
      z: 0.02 + random() * 0.05,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed * 0.48,
      vz: 0.7 + random() * 1.0,
      r: 0.0055 + random() * 0.007,
      rot: 0,
      spin: 0,
      tone: 0,
      shape: [],
      hops: 0,
      rest: false,
    });
  }
}

/** Move everything on by one fixed step (1/120 s). */
export function step(sim: Sim) {
  sim.t += STEP;

  while (sim.next < IMPACTS.length && sim.t >= IMPACTS[sim.next].t) {
    burst(sim, IMPACTS[sim.next]);
    sim.next++;
  }

  for (const bit of sim.bits) {
    if (bit.rest) continue;

    bit.vz -= G * STEP;
    // The air slows the sideways flight a little.
    const air = 1 - 0.9 * STEP;
    bit.vx *= air;
    bit.vy *= air;
    bit.x += bit.vx * STEP;
    bit.y += bit.vy * STEP;
    bit.z += bit.vz * STEP;
    bit.rot += bit.spin * STEP;

    if (bit.z > 0) continue;
    bit.z = 0;

    if (bit.sauce) {
      // Sauce does not bounce: it lands and stays as a small splat.
      bit.rest = true;
      bit.vx = bit.vy = bit.vz = 0;
    } else if (bit.vz < -0.2 && bit.hops < 3) {
      // A crumb hops, a little lower and slower each time.
      bit.vz = -bit.vz * 0.33;
      bit.vx *= 0.6;
      bit.vy *= 0.6;
      bit.spin *= 0.5;
      bit.hops++;
    } else {
      bit.rest = true;
      bit.vx = bit.vy = bit.vz = 0;
      bit.spin = 0;
    }
  }
}

/** True once both wings have landed and every crumb has stopped. */
export function isDone(sim: Sim) {
  return sim.next >= IMPACTS.length && sim.bits.every((bit) => bit.rest);
}

/** Run the whole landing at once (for a visitor who should just see the finished board). */
export function settle(sim: Sim) {
  for (let i = 0; i < 1200 && !isDone(sim); i++) step(sim);
}

/* ------------------------------------------------------------------------------------------------- */

let sauceSprite: HTMLCanvasElement | null = null;

/** A glossy ball of sauce, drawn once and stamped for every fleck. */
function sauceBall() {
  if (sauceSprite) return sauceSprite;
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const body = ctx.createRadialGradient(size * 0.38, size * 0.34, size * 0.04, size / 2, size / 2, size / 2);
    body.addColorStop(0, "#ff9a52");
    body.addColorStop(0.35, "#f0501c");
    body.addColorStop(1, "#a8080a");
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255, 244, 226, 0.85)";
    ctx.beginPath();
    ctx.ellipse(size * 0.36, size * 0.3, size * 0.1, size * 0.065, -0.6, 0, Math.PI * 2);
    ctx.fill();
  }
  sauceSprite = canvas;
  return canvas;
}

/** Paint every crumb, fleck and shadow. The canvas is centred on the middle of the plate's square. */
export function draw(ctx: CanvasRenderingContext2D, sim: Sim, view: View) {
  const { width, height, unit } = view;
  ctx.clearRect(0, 0, width, height);
  if (sim.bits.length === 0) return;

  const cx = width / 2;
  const cy = height / 2;
  // Bits further up the screen are further away: paint them first.
  const order = [...sim.bits].sort((a, b) => a.y - b.y);

  // Shadows on the board, lighter and wider the higher the bit is.
  for (const bit of order) {
    const lift = Math.max(0, 1 - bit.z / 0.42);
    if (lift <= 0) continue;
    const alpha = (bit.sauce ? 0.22 : 0.34) * lift;
    const rx = bit.r * unit * (bit.sauce ? 1.5 : 1.25) * (1 + bit.z * 2.2);
    ctx.fillStyle = `rgba(0, 0, 0, ${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.ellipse(cx + (bit.x + bit.z * 0.12) * unit, cy + (bit.y + bit.z * 0.06) * unit, rx, rx * 0.46, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const bit of order) {
    const px = cx + bit.x * unit;
    const py = cy + (bit.y - bit.z) * unit;
    const r = bit.r * unit;

    if (bit.sauce) {
      if (bit.rest) {
        // A splat: flat, dark red, with a small shine.
        ctx.fillStyle = "rgba(150, 14, 10, 0.92)";
        ctx.beginPath();
        ctx.ellipse(px, py, r * 1.9, r * 0.86, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(255, 150, 90, 0.55)";
        ctx.beginPath();
        ctx.ellipse(px - r * 0.45, py - r * 0.2, r * 0.5, r * 0.2, -0.2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // In the air it is stretched along its flight.
        const along = Math.atan2(bit.vy - bit.vz, bit.vx);
        const stretch = 1 + Math.min(1.4, Math.hypot(bit.vx, bit.vy - bit.vz) * 1.3);
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(along);
        ctx.drawImage(sauceBall(), (-r * stretch) * 1, -r, r * 2 * stretch, r * 2);
        ctx.restore();
      }
      continue;
    }

    const [body, lit] = CRUMBS[bit.tone];
    const corners = bit.shape.length;
    const trace = (scale: number, dx: number, dy: number) => {
      ctx.beginPath();
      for (let i = 0; i < corners; i++) {
        const a = bit.rot + (i / corners) * Math.PI * 2;
        const rr = r * bit.shape[i] * scale;
        const x = px + dx + Math.cos(a) * rr;
        const y = py + dy + Math.sin(a) * rr * 0.82;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
    };
    ctx.fillStyle = body;
    trace(1, 0, 0);
    ctx.fill();
    ctx.fillStyle = lit;
    ctx.globalAlpha = 0.75;
    trace(0.6, -r * 0.22, -r * 0.26);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}
