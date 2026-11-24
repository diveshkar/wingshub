/**
 * The sauce splash of the opening, drawn as a lit liquid instead of flat shapes.
 *
 * The motion is plain physics worked out in closed form, so any moment can be drawn directly (which also
 * lets the splash be stepped through frame by frame): every piece is thrown from the clash at some speed,
 * slowed by drag, pulled down by gravity and bent a little sideways. Thick sauce does not fly as a ball: it
 * goes as a ribbon that wriggles, is thickest at its head and thins towards the tail, and after a moment
 * pinches off into beads that keep flying along the same path. Big blobs fly at the camera and splat on the
 * lens, then slide down. Last, the sauce spreads over the whole screen and runs down it, which is how the
 * page underneath is uncovered.
 *
 * The shader gives every piece a surface height (a rounded blob has a rounded top), then lights it from the
 * upper left (the same side as in the photo the wings were cut from): thick sauce is deep red, thin sauce
 * lets the warm light behind it through as orange, and the shine is a soft window reflection, not a hard dot.
 */

export type Sauce = {
  /** Draw the splash t seconds after the wings hit. */
  draw: (t: number) => void;
  resize: () => void;
  /** Stop using the shader (the canvas can be used again). */
  dispose: () => void;
  /** Give the graphics context back, for good. */
  release: () => void;
  /** Draw smaller (and so faster): for a computer that cannot keep up. */
  lower: () => void;
};

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const frag = (count: number) => `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

#define N ${count}

uniform vec2 uSize;
uniform vec2 uRes;
uniform vec2 uCenter;
uniform float uScale;
uniform vec4 uFlood;
uniform vec4 uA[N];
uniform vec4 uB[N];

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}

float smin(float a, float b, float k) {
  float h = max(k - abs(a - b), 0.0) / k;
  return min(a, b) - h * h * k * 0.25;
}

float smax(float a, float b, float k) {
  float h = max(k - abs(a - b), 0.0) / k;
  return max(a, b) + h * h * k * 0.25;
}

float box(vec2 p, vec2 c, vec2 half_, float soft) {
  vec2 d = abs(p - c) - half_;
  return 1.0 - smoothstep(-soft, soft, max(d.x, d.y));
}

/* Distance to the sauce (negative inside) and, through h, how high its surface is at p. */
float field(vec2 p, out float h) {
  float d = 1e5;
  h = 0.0;

  for (int i = 0; i < N; i++) {
    vec4 a = uA[i];
    vec4 b = uB[i];
    if (b.x <= 0.0) continue;
    vec2 ba = a.xy - a.zw;
    float len2 = dot(ba, ba);
    vec2 dm = p - 0.5 * (a.xy + a.zw);
    float reach = 0.5 * sqrt(len2) + b.x + 16.0;
    if (dot(dm, dm) > reach * reach) continue;
    float len = sqrt(len2);
    float along = len2 > 0.01 ? clamp(dot(p - a.zw, ba) / len2, 0.0, 1.0) : 1.0;
    float tail = mix(b.x, b.y, smoothstep(0.0, b.x * 1.6, len));
    float r = max(mix(tail, b.x, smoothstep(0.0, 1.0, along)), 0.05);
    float da = length(p - a.zw - ba * along);
    /* Big blobs get an uneven edge, small drops stay round. */
    float wobble = (vnoise(p * 0.05 + a.x * 0.013) - 0.5) * min(b.x * 0.4, 11.0);
    d = smin(d, da - r + wobble, 8.0);
    float q = da / r;
    h = smax(h, min(r, 17.0) * sqrt(max(1.0 - q * q, 0.0)), 5.0);
  }

  if (uFlood.w > 0.5) {
    vec2 q = p - uCenter;
    float ang = atan(q.y, q.x);
    float reach = uFlood.x * (1.0 + 0.3 * (vnoise(vec2(ang * 2.3 + uFlood.y, 1.7)) - 0.5) + 0.05 * sin(ang * 7.0 + uFlood.y * 3.0));
    float df = length(q) - reach;
    d = smin(d, df, 22.0);
    float film = (6.2 + 8.0 * exp(-abs(df + 7.0) / 9.0)) * (1.0 - smoothstep(-6.0, 0.0, df));
    h = smax(h, film, 2.0);
  }

  /* The sauce running down the screen: everything above the line has slid away, leaving a thick lip. */
  if (uFlood.w > 1.5) {
    float edge = uFlood.z + 70.0 * vnoise(vec2(p.x * 0.007, uFlood.y)) + 55.0 * vnoise(vec2(p.x * 0.02, 4.0)) + 90.0 * pow(vnoise(vec2(p.x * 0.012, 8.0)), 2.0);
    float de = edge - p.y;
    d = smax(d, de, 26.0);
    h = h + 8.0 * exp(-abs(de + 6.0) / 7.0) * (1.0 - smoothstep(-4.0, 0.0, de)) * step(d, 0.0);
    h = h * (1.0 - smoothstep(-2.0, 6.0, de));
  }

  h = max(h, min(1.6, max(-d, 0.0) * 0.6));
  /* Slow swells in the surface, so a big sheet is never a flat colour. */
  h += (vnoise(p * 0.011 + uFlood.y) - 0.5) * 10.0 * smoothstep(0.0, 6.0, h);
  h += (vnoise(p * 0.035 + 3.1) - 0.5) * 2.4 * smoothstep(0.0, 4.0, h);
  return d;
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uRes * uSize;
  float px = uSize.x / uRes.x;

  float h;
  float d = field(p, h);
  float cover = 1.0 - smoothstep(-px, px, d);
  if (cover < 0.003) {
    gl_FragColor = vec4(0.0);
    return;
  }

  float e = max(px, 1.0);
  float hx; float hy;
  field(p + vec2(e, 0.0), hx);
  field(p + vec2(0.0, e), hy);
  vec2 grad = vec2(hx - h, hy - h) / e;
  vec3 n = normalize(vec3(-grad * 1.1, 1.0));

  /* Light from the upper left, like the photo the wings come from. */
  vec3 light = normalize(vec3(-0.55, -0.62, 0.56));
  vec3 view = vec3(0.0, 0.0, 1.0);
  float nl = max(dot(n, light), 0.0);
  float nh = max(dot(n, normalize(light + view)), 0.0);
  float hot = pow(nh, 70.0) * 0.55;

  /* The shine is a reflection of a window and of a strip light, not a hard white dot. */
  vec3 refl = reflect(-view, n);
  vec2 rp = refl.xy / max(refl.z, 0.25);
  float window = box(rp, vec2(-0.5, -0.8), vec2(0.36, 0.17), 0.1);
  float strip = box(rp, vec2(0.95, 0.3), vec2(0.07, 0.55), 0.08);
  float rim = pow(1.0 - n.z, 2.0);

  float thick = 2.0 * min(h, 26.0);
  vec2 g = p - uCenter;
  float glow = exp(-dot(g, g) / (2.0 * uScale * uScale * 0.11));

  /* Thick sauce is deep red; thin sauce lets the warm light behind it through as orange. */
  vec3 scatter = vec3(0.8, 0.085, 0.03) * (0.28 + 0.72 * nl);
  vec3 through = vec3(1.0, 0.4, 0.08) * (0.3 + 0.6 * glow) * exp(-0.06 * thick);
  vec3 col = scatter * (1.0 - exp(-0.09 * thick)) + through;
  col.g *= 1.0 + 0.55 * vnoise(p * 0.004 + 9.0);

  float fleck = smoothstep(0.84, 0.9, vnoise(p * 0.9 + 4.0)) * smoothstep(3.0, 9.0, h);
  col *= 1.0 - 0.28 * fleck;

  float shine = hot + window * 0.62 + strip * 0.3;
  col += vec3(1.0, 0.92, 0.82) * shine * (0.45 + 0.55 * smoothstep(0.0, 6.0, h));
  col += vec3(1.0, 0.42, 0.14) * rim * 0.3 * smoothstep(0.0, 4.0, h);

  float alpha = cover * (1.0 - exp(-0.2 * thick - 0.14));
  gl_FragColor = vec4(col * cover, alpha);
}
`;

/* ------------------------------------------------------------------------------------------ */

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const easeOut = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
const easeInOut = (t: number) => {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
};
const easeOutBack = (t: number) => {
  const x = clamp01(t) - 1;
  return 1 + 2.4 * x * x * x + 1.4 * x * x;
};

/** A small, fixed random sequence, so the splash is the same every time. */
function random(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Out = { a: Float32Array; b: Float32Array };
type Item = (t: number, out: Out, i: number) => void;
type Point = readonly [number, number];

/**
 * Where something thrown at (vx, vy) is after t seconds, with drag k, gravity g and a steady sideways
 * pull (ax, ay) that bends its path.
 */
function flight(x0: number, y0: number, vx: number, vy: number, k: number, g: number, ax: number, ay: number, t: number): Point {
  const tt = Math.max(t, 0);
  const e = (1 - Math.exp(-k * tt)) / k;
  const s = tt / k - e / k;
  return [x0 + vx * e + ax * s, y0 + vy * e + (g + ay) * s];
}

function buildItems(width: number, height: number): Item[] {
  const rnd = random(23);
  const R = Math.hypot(width, height) / 2;
  const S = Math.min(width, height * 1.25);
  const cx = width / 2;
  const cy = height / 2;
  const items: Item[] = [];

  const put = (out: Out, i: number, hx: number, hy: number, tx: number, ty: number, rh: number, rt: number) => {
    out.a.set([hx, hy, tx, ty], i * 4);
    out.b.set([rh, rt, 0, 0], i * 4);
  };
  const off = (out: Out, i: number) => put(out, i, 0, 0, 0, 0, 0, 0);

  /*
    Thick sauce does not fly as a ball or a stick. It leaves as a fat head with a thin tail behind it, like a
    tadpole; the tail is a thread that wriggles and, after a moment, pinches into beads that carry on along
    the same path. Because the wings meet along a line, most of the sauce is squeezed out above and below it,
    and a smaller share goes sideways.
  */
  const lags = [0.085, 0.165];
  for (let n = 0; n < 12; n++) {
    const upDown = rnd() < 0.72;
    const base = upDown ? (rnd() < 0.5 ? -90 : 90) : rnd() < 0.5 ? 0 : 180;
    const a = ((base + (rnd() - 0.5) * (upDown ? 110 : 70)) * Math.PI) / 180;
    const speed = R * (1.0 + rnd() * 1.6);
    const vx = Math.cos(a) * speed;
    const vy = Math.sin(a) * speed - R * 0.06;
    const k = 1.35 + rnd() * 0.5;
    const g = S * (0.42 + rnd() * 0.3);
    const bend = (rnd() - 0.5) * S * 0.9;
    const px = -Math.sin(a);
    const py = Math.cos(a);
    const snake = S * (0.004 + rnd() * 0.009);
    const phase = rnd() * 6.28;
    const r0 = S * (0.011 + rnd() * 0.014);
    const life = 1.7 + rnd() * 0.4;
    const pinchAt = 0.45 + rnd() * 0.3;
    const thin = 0.14 + rnd() * 0.12;

    const at = (t: number, lag: number): Point => {
      const tt = t - lag;
      const [x, y] = flight(cx, cy, vx, vy, k, g, px * bend, py * bend, tt);
      const w = Math.sin(tt * 11 + phase) * snake * smooth(0.04, 0.4, tt);
      return [x + px * w, y + py * w];
    };
    const fade = (t: number) => 1 - smooth(life - 0.35, life, t);

    // the fat head and the thread behind it
    items.push((t, out, i) => {
      if (t <= 0 || t > life) return off(out, i);
      const [hx, hy] = at(t, 0);
      const tau = Math.min(t, (0.06 + 0.15 * smooth(0.05, 0.6, t)) * (1 - 0.9 * smooth(pinchAt, pinchAt + 0.2, t)));
      const [tx, ty] = at(t, tau);
      const rh = r0 * fade(t) * (0.55 + 0.45 * easeOut(t / 0.09));
      put(out, i, hx, hy, tx, ty, rh, rh * thin);
    });

    // beads that gather on the thread
    lags.forEach((lag, j) => {
      items.push((t, out, i) => {
        if (t <= lag || t > life) return off(out, i);
        const [hx, hy] = at(t, lag);
        const r = r0 * (j === 0 ? 0.46 : 0.34) * fade(t) * (0.6 + 0.4 * smooth(pinchAt - 0.15, pinchAt + 0.2, t));
        put(out, i, hx, hy, hx, hy, r, r);
      });
    });
  }

  /* A fine spray, thrown much faster. */
  for (let n = 0; n < 34; n++) {
    const upDown = rnd() < 0.62;
    const base = upDown ? (rnd() < 0.5 ? -90 : 90) : rnd() * 360;
    const a = ((base + (rnd() - 0.5) * (upDown ? 140 : 0)) * Math.PI) / 180;
    const speed = R * (1.2 + rnd() * 2.2);
    const vx = Math.cos(a) * speed;
    const vy = Math.sin(a) * speed - R * 0.06;
    const k = 1.2 + rnd() * 0.7;
    const g = S * (0.4 + rnd() * 0.4);
    const r0 = S * (0.0028 + rnd() * 0.0055);
    const life = 0.9 + rnd() * 0.7;
    const stretch = 0.03 + rnd() * 0.03;
    items.push((t, out, i) => {
      if (t < 0.004 || t > life) return off(out, i);
      const [hx, hy] = flight(cx, cy, vx, vy, k, g, 0, 0, t);
      const [tx, ty] = flight(cx, cy, vx, vy, k, g, 0, 0, t - Math.min(t, stretch));
      const r = r0 * (1 - smooth(life - 0.25, life, t));
      put(out, i, hx, hy, tx, ty, r, r * 0.55);
    });
  }

  /* Bigger drops that fly slower. */
  for (let n = 0; n < 10; n++) {
    const a = rnd() * Math.PI * 2;
    const speed = R * (0.8 + rnd() * 1.4);
    const vx = Math.cos(a) * speed;
    const vy = Math.sin(a) * speed - R * 0.08;
    const k = 1.2 + rnd() * 0.5;
    const g = S * (0.4 + rnd() * 0.35);
    const r0 = S * (0.007 + rnd() * 0.008);
    const life = 1.35 + rnd() * 0.5;
    items.push((t, out, i) => {
      if (t < 0.005 || t > life) return off(out, i);
      const [hx, hy] = flight(cx, cy, vx, vy, k, g, 0, 0, t);
      const [tx, ty] = flight(cx, cy, vx, vy, k, g, 0, 0, t - Math.min(t, 0.05));
      const r = r0 * (1 - smooth(life - 0.3, life, t));
      put(out, i, hx, hy, tx, ty, r, r * 0.8);
    });
  }

  /* Heavy globs that hang in the air longer, towards the camera. */
  for (let n = 0; n < 3; n++) {
    const a = ((n * 120 + 20 + rnd() * 70) * Math.PI) / 180;
    const speed = R * (0.55 + rnd() * 0.4);
    const vx = Math.cos(a) * speed;
    const vy = Math.sin(a) * speed - R * 0.1;
    const r0 = S * (0.03 + rnd() * 0.016);
    const life = 1.9;
    items.push((t, out, i) => {
      if (t < 0 || t > life) return off(out, i);
      const [hx, hy] = flight(cx, cy, vx, vy, 1.1, S * 0.5, 0, 0, t);
      const [tx, ty] = flight(cx, cy, vx, vy, 1.1, S * 0.5, 0, 0, t - Math.min(t, 0.085));
      const r = r0 * (0.5 + 0.5 * easeOut(t / 0.12)) * (1 - smooth(life - 0.4, life, t));
      put(out, i, hx, hy, tx, ty, r, r * 0.6);
    });
  }

  /* The sauce squeezed out between the wings: two lumps that swell and are blown apart in the first moments. */
  [-1, 1].forEach((side) => {
    items.push((t, out, i) => {
      if (t < 0 || t > 0.4) return off(out, i);
      const r = S * 0.042 * easeOut(t / 0.08) * (1 - smooth(0.12, 0.4, t));
      const x = cx + side * S * 0.03 * easeOut(t / 0.25);
      put(out, i, x, cy, x, cy, r, r);
    });
  });

  /* Blobs that hit the lens, spread out in a splat, and begin to slide down. */
  [0.2, 0.31, 0.42, 0.52, 0.64].forEach((hit) => {
    const a = rnd() * Math.PI * 2;
    const dist = S * (0.16 + rnd() * 0.3);
    const x = cx + Math.cos(a) * dist * (width / S) * 0.8;
    const y = cy + Math.sin(a) * dist * 0.8;
    const R0 = S * (0.05 + rnd() * 0.04);
    const slide = S * (0.05 + rnd() * 0.06);
    items.push((t, out, i) => {
      if (t < hit - 0.09) return off(out, i);
      const grow = t < hit ? 0.1 * easeOut((t - (hit - 0.09)) / 0.09) : 0.1 + 0.9 * easeOutBack((t - hit) / 0.2);
      const r = R0 * grow;
      const sl = t > hit ? slide * Math.pow(t - hit, 2) : 0;
      put(out, i, x, y + sl, x, y + sl * 0.1, r, r * 0.4);
    });
  });

  return items;
}

export function createSauce(canvas: HTMLCanvasElement, onLost?: () => void): Sauce | null {
  const gl = canvas.getContext("webgl", {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "high-performance",
  });
  if (!gl) return null;

  let width = window.innerWidth;
  let height = window.innerHeight;
  let quality = 1;
  let items = buildItems(width, height);
  const limit = Math.floor((gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS) as number) / 2) - 8;
  let count = Math.max(8, Math.min(items.length, limit));

  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  };

  const vertex = compile(gl.VERTEX_SHADER, VERT);
  const fragment = compile(gl.FRAGMENT_SHADER, frag(count));
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, "aPos");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  gl.clearColor(0, 0, 0, 0);

  const u = (name: string) => gl.getUniformLocation(program, name);
  const uSize = u("uSize");
  const uRes = u("uRes");
  const uCenter = u("uCenter");
  const uScale = u("uScale");
  const uFlood = u("uFlood");
  const uA = u("uA");
  const uB = u("uB");
  const out: Out = { a: new Float32Array(count * 4), b: new Float32Array(count * 4) };

  const resize = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    items = buildItems(width, height);
    count = Math.min(count, items.length);
    // The sauce is soft, so it is drawn at a lower resolution and stretched. The number of pixels it paints
    // is capped (about 0.42 million, whatever the screen), so a big or sharp screen costs no more than a small one.
    const q =
      Math.min(0.8, 0.5 * Math.min(window.devicePixelRatio || 1, 2), Math.sqrt(420000 / (width * height))) * quality;
    canvas.width = Math.max(2, Math.round(width * q));
    canvas.height = Math.max(2, Math.round(height * q));
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uSize, width, height);
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform2f(uCenter, width / 2, height / 2);
    gl.uniform1f(uScale, Math.min(width, height * 1.25));
  };

  const draw = (t: number) => {
    const R = Math.hypot(width, height) / 2;
    for (let i = 0; i < count; i++) items[i](t, out, i);

    // 1 = the sauce spreads over the screen, 2 = it also runs down and uncovers the page.
    const spread = easeOut((t - 0.5) / 0.9);
    const draining = t > 1.3;
    const drain = easeInOut((t - 1.3) / 0.8);
    const active = t > 0.5 ? (draining ? 2 : 1) : 0;
    gl.uniform4f(uFlood, R * 1.45 * spread, 3.7, -120 + (height + 420) * drain, active);
    gl.uniform4fv(uA, out.a);
    gl.uniform4fv(uB, out.b);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    onLost?.();
  });

  resize();

  return {
    draw,
    resize,
    dispose: () => {
      gl.deleteProgram(program);
      gl.deleteBuffer(buffer);
    },
    release: () => {
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
    lower: () => {
      quality = Math.max(0.3, quality * 0.65);
      resize();
    },
  };
}
