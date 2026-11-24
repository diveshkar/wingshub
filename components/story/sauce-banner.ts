/**
 * Sauce poured along the bottom of the hero and running down into the next section, drawn as a lit liquid
 * instead of a flat shape. It uses the same idea as the sauce in the opening (intro-sauce.ts): every blob has
 * a surface height, light comes from the upper left, thick sauce is deep red, thin sauce lets the page
 * behind it through as orange, and the shine is a soft window reflection. The drips are pulled into teardrops
 * by surface tension, and a soft red shadow falls on the cream below.
 *
 * It is one small fragment shader on a transparent canvas, so it costs no image download. It runs for about
 * three seconds when it scrolls into view and then rests, except that the light slides a little as the page
 * scrolls, like moving past something wet. With reduced motion it is drawn once, finished.
 */

export type Banner = {
  /** Draw the banner t seconds after it started (a big number means finished). */
  draw: (t: number, scroll?: number) => void;
  resize: () => void;
  dispose: () => void;
};

/* Page colours the sauce sits over: the foot of the hero (#2a0408) and the next section (bone-100, #fbf6ee). */
const DARK = [0.165, 0.016, 0.031];
const CREAM = [0.984, 0.965, 0.933];

/** The design is 1440 px wide; everything scales with the width of the page, between 0.6x and 1.1x. */
export const SEAM = 26;
const DESIGN_HEIGHT = 300;

/** x (share of the width), width, length, delay (s), duration (s), bulb size, sway, phase. */
const DRIPS = [
  [0.045, 17, 78, 0.15, 1.7, 1.28, 1.2, 0.3],
  [0.115, 12, 46, 0.5, 1.3, 1.2, 0.8, 1.7],
  [0.205, 22, 168, 0.0, 2.4, 1.3, 1.6, 2.4],
  [0.3, 14, 70, 0.7, 1.5, 1.25, 0.9, 0.9],
  [0.385, 26, 205, 0.25, 2.7, 1.32, 1.4, 4.1],
  [0.475, 13, 52, 0.9, 1.4, 1.22, 0.7, 3.3],
  [0.56, 20, 128, 0.4, 2.0, 1.3, 1.1, 5.2],
  [0.65, 15, 88, 0.1, 1.8, 1.26, 1.0, 0.2],
  [0.735, 24, 188, 0.55, 2.6, 1.3, 1.5, 2.9],
  [0.82, 12, 60, 0.8, 1.4, 1.2, 0.8, 4.6],
  [0.905, 18, 110, 0.3, 2.0, 1.27, 1.2, 1.1],
] as const;

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2 uSize;
uniform float uDpr;
uniform float uScale;
uniform float uTime;
uniform float uScroll;
uniform vec3 uDark;
uniform vec3 uCream;
uniform vec4 uA[11];
uniform vec4 uB[11];

const float SEAM = ${SEAM}.0;
const float BAND = 30.0;
const float R = 13.0;

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

/* Distance to the sauce in design pixels (negative inside), and how high its surface is there. */
float field(vec2 p, float t, out float h) {
  float pour = 1.0 - pow(1.0 - clamp(t / 0.9, 0.0, 1.0), 3.0);
  float edge = SEAM + BAND * pour + 6.0 * (vnoise(vec2(p.x * 0.013, 2.0)) - 0.4) * pour;
  float top = 3.0 + 5.0 * vnoise(vec2(p.x * 0.02, 9.0));
  float d = max(p.y - edge, top - p.y);
  float tb = clamp(-d / R, 0.0, 1.0);
  h = R * sqrt(1.0 - (1.0 - tb) * (1.0 - tb));

  for (int i = 0; i < 11; i++) {
    vec4 a = uA[i];
    vec4 b = uB[i];
    if (abs(p.x - a.x) > a.y * 1.7 + 44.0) continue;
    float g = clamp((t - a.w) / b.x, 0.0, 1.0);
    g = 1.0 - pow(1.0 - g, 3.0);
    float len = a.z * g;
    float sway = b.z * sin((p.y - edge) * 0.03 + b.w) * g;
    vec2 top_ = vec2(a.x, edge - 6.0);
    vec2 tip = vec2(a.x + sway, edge - 6.0 + len);
    float r = a.y * 0.5;
    float rb = r * b.y * (0.6 + 0.4 * g);
    vec2 ba = tip - top_;
    float len2 = max(dot(ba, ba), 0.01);
    float along = clamp(dot(p - top_, ba) / len2, 0.0, 1.0);
    /* Thin at the top, widening to the bulb at the bottom: a teardrop. */
    float rr = mix(r * 0.86, rb, smoothstep(0.35, 1.0, along)) * (1.0 + 0.1 * sin(along * 9.0 + b.w) * (1.0 - along));
    float da = length(p - top_ - ba * along);
    d = smin(d, da - rr, 10.0);
    float q = da / rr;
    h = smax(h, min(rr, 13.0) * sqrt(max(1.0 - q * q, 0.0)), 4.0);
  }

  h = max(h, min(1.6, max(-d, 0.0) * 0.6));
  h += (vnoise(p * 0.05 + 3.1) - 0.5) * 1.4 * smoothstep(0.0, 5.0, h);
  return d;
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, uSize.y * uDpr - gl_FragCoord.y) / (uDpr * uScale);
  float px = 1.0 / (uDpr * uScale);
  float t = uTime;

  float h;
  float d = field(p, t, h);
  float hs;
  float shadowD = field(p - vec2(6.0, 11.0), t, hs);

  float cover = 1.0 - smoothstep(-px, px, d);
  float shadowA = (1.0 - smoothstep(-3.0, 15.0, shadowD)) * 0.36 * smoothstep(SEAM - 2.0, SEAM + 2.0, p.y);
  if (cover < 0.002 && shadowA < 0.002) {
    gl_FragColor = vec4(0.0);
    return;
  }

  float e = max(px, 0.9);
  float hx; float hy;
  field(p + vec2(e, 0.0), t, hx);
  field(p + vec2(0.0, e), t, hy);
  vec2 grad = vec2(hx - h, hy - h) / e;
  vec3 n = normalize(vec3(-grad * 1.2, 1.0));

  vec3 light = normalize(vec3(-0.52 + 0.4 * (uScroll - 0.5), -0.62, 0.6));
  vec3 view = vec3(0.0, 0.0, 1.0);
  float nl = max(dot(n, light), 0.0);
  float nh = max(dot(n, normalize(light + view)), 0.0);
  float hot = pow(nh, 70.0) * 0.5;
  vec3 refl = reflect(-view, n);
  vec2 rp = refl.xy / max(refl.z, 0.25);
  float window = box(rp, vec2(-0.5 + 0.3 * (uScroll - 0.5), -0.8), vec2(0.36, 0.17), 0.1);
  float strip = box(rp, vec2(0.95, 0.3), vec2(0.07, 0.55), 0.08);
  float rim = pow(1.0 - n.z, 2.2);

  /* Thick sauce is deep red; thin sauce lets the page behind it through. */
  float thick = 2.0 * h;
  vec3 bg = mix(uDark, uCream, smoothstep(SEAM - 1.5, SEAM + 1.5, p.y));
  vec3 sigma = vec3(0.036, 0.085, 0.115);
  vec3 through = bg * exp(-sigma * thick);
  vec3 body = vec3(0.55, 0.045, 0.03) * (0.3 + 0.7 * nl);
  vec3 col = through + body * (1.0 - exp(-0.05 * thick));

  float fleck = smoothstep(0.84, 0.9, vnoise(p * 1.8 + 4.0)) * smoothstep(3.0, 8.0, h);
  col *= 1.0 - 0.3 * fleck;

  float shine = hot + window * 0.6 + strip * 0.28;
  col += vec3(1.0, 0.92, 0.84) * shine * (0.45 + 0.55 * smoothstep(0.0, 8.0, h));
  col += vec3(1.0, 0.42, 0.22) * rim * 0.22 * smoothstep(0.0, 5.0, h);

  vec3 shadowColor = vec3(0.3, 0.035, 0.03);
  float alpha = cover + shadowA * (1.0 - cover);
  vec3 rgb = col * cover + shadowColor * shadowA * (1.0 - cover);
  gl_FragColor = vec4(rgb, alpha);
}
`;

export function createBanner(host: HTMLElement, canvas: HTMLCanvasElement): Banner | null {
  const gl = canvas.getContext("webgl", {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "low-power",
  });
  if (!gl) return null;

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
  const fragment = compile(gl.FRAGMENT_SHADER, FRAG);
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
  const uDpr = u("uDpr");
  const uScale = u("uScale");
  const uTime = u("uTime");
  const uScroll = u("uScroll");
  gl.uniform3fv(u("uDark"), DARK);
  gl.uniform3fv(u("uCream"), CREAM);

  let width = 0;
  let last = { t: 99, scroll: 0.5 };

  const resize = () => {
    width = host.clientWidth;
    if (width === 0) return;
    const scale = Math.min(1.1, Math.max(0.6, width / 1440));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const height = Math.round(DESIGN_HEIGHT * scale);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.style.top = `${-Math.round(SEAM * scale)}px`;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);

    const drips = new Float32Array(44);
    const extra = new Float32Array(44);
    DRIPS.forEach(([x, w, length, delay, duration, bulb, sway, phase], i) => {
      drips.set([(x * width) / scale, w, length, delay], i * 4);
      extra.set([duration, bulb, sway, phase], i * 4);
    });
    gl.uniform4fv(u("uA"), drips);
    gl.uniform4fv(u("uB"), extra);
    gl.uniform2f(uSize, width, height);
    gl.uniform1f(uDpr, dpr);
    gl.uniform1f(uScale, scale);
  };

  const draw = (t: number, scroll = 0.5) => {
    if (width === 0) return;
    last = { t, scroll };
    gl.uniform1f(uTime, t);
    gl.uniform1f(uScroll, scroll);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  resize();

  return {
    draw: (t, scroll) => draw(t, scroll ?? last.scroll),
    resize: () => {
      resize();
      draw(last.t, last.scroll);
    },
    dispose: () => {
      gl.deleteProgram(program);
      gl.deleteBuffer(buffer);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
