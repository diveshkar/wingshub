"use client";

import { useEffect, useRef } from "react";

/**
 * Sauce poured along the bottom of the hero and running down into the next section, drawn as a lit
 * liquid instead of a flat shape: a height field gives it a rounded surface, light comes from the upper
 * left (and slides a little as the page scrolls), thick sauce is dark and thin sauce lets the page
 * through as orange, the drips are pulled into teardrops by surface tension, and a soft red shadow
 * falls on the cream below. It is one small fragment shader on a transparent canvas, so it costs no
 * image download. It runs for about three seconds when it scrolls into view and then rests; with
 * reduced motion it is drawn once, finished. Without WebGL the CSS drips underneath stay visible.
 */

/* Page colours the sauce sits over: the foot of the hero (#2a0408) and the next section (bone-100). */
const DARK: [number, number, number] = [0.165, 0.016, 0.031];
const CREAM: [number, number, number] = [0.984, 0.965, 0.933];

/** Design size: the 1440 px layout. Everything scales with the width of the page, between 0.6x and 1.1x. */
const SEAM = 26;
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

const TOTAL_SECONDS = 3.9;

const VERTEX = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAGMENT = `
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
const float BAND = 22.0;
const float R = 11.0;

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

float fbm(vec2 p) {
  return 0.5 * vnoise(p) + 0.25 * vnoise(p * 2.03 + 7.1) + 0.125 * vnoise(p * 4.1 + 3.3);
}

float smin(float a, float b, float k) {
  float h = max(k - abs(a - b), 0.0) / k;
  return min(a, b) - h * h * k * 0.25;
}

/* Distance to the sauce in design pixels: negative inside. */
float sdf(vec2 p, float t) {
  float pour = 1.0 - pow(1.0 - clamp(t / 0.9, 0.0, 1.0), 3.0);
  float edge = SEAM + BAND * pour + 6.0 * (fbm(vec2(p.x * 0.013, 2.0)) - 0.35) * pour;
  float top = 3.0 + 5.0 * fbm(vec2(p.x * 0.02, 9.0));
  float d = max(p.y - edge, top - p.y);

  for (int i = 0; i < 11; i++) {
    vec4 a = uA[i];
    vec4 b = uB[i];
    if (abs(p.x - a.x) > a.y * 1.7 + 42.0) continue;
    float g = clamp((t - a.w) / b.x, 0.0, 1.0);
    g = 1.0 - pow(1.0 - g, 3.0);
    float len = a.z * g;
    vec2 q = p - vec2(a.x, edge - 5.0);
    q.x -= b.z * sin(q.y * 0.03 + b.w) * g;
    float r = a.y * 0.5;
    float rs = r * (1.0 - 0.14 * clamp(q.y / max(len, 1.0), 0.0, 1.0));
    float dStem = length(vec2(q.x, q.y - clamp(q.y, -8.0, len))) - rs;
    float dBulb = length(q - vec2(0.0, len)) - r * b.y * (0.6 + 0.4 * g);
    d = smin(d, smin(dStem, dBulb, r * 0.8), 10.0);
  }
  return d;
}

/* A rounded surface: flat at the middle, falling away to nothing at the edge. */
float height(float d) {
  float t = clamp(-d / R, 0.0, 1.0);
  return R * sqrt(1.0 - (1.0 - t) * (1.0 - t));
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, uSize.y * uDpr - gl_FragCoord.y) / (uDpr * uScale);
  float px = 1.0 / (uDpr * uScale);
  float t = uTime;

  float d = sdf(p, t);
  float shadowD = sdf(p - vec2(6.0, 11.0), t);

  float cover = 1.0 - smoothstep(-px, px, d);
  float shadowA = (1.0 - smoothstep(-3.0, 15.0, shadowD)) * 0.36 * smoothstep(SEAM - 2.0, SEAM + 2.0, p.y);

  if (cover < 0.002 && shadowA < 0.002) {
    gl_FragColor = vec4(0.0);
    return;
  }

  const float e = 0.9;
  float h = height(d);
  vec2 grad = vec2(
    height(sdf(p + vec2(e, 0.0), t)) - height(sdf(p - vec2(e, 0.0), t)),
    height(sdf(p + vec2(0.0, e), t)) - height(sdf(p - vec2(0.0, e), t))
  ) / (2.0 * e);

  /* Tiny undulations in the surface, so it is not perfectly smooth. */
  grad += vec2(vnoise(p * 0.6) - 0.5, vnoise(p * 0.6 + 17.0) - 0.5) * 0.1;
  vec3 n = normalize(vec3(-grad * 1.3, 1.0));

  vec3 light = normalize(vec3(-0.52 + 0.4 * (uScroll - 0.5), -0.62, 0.6));
  vec3 view = vec3(0.0, 0.0, 1.0);
  vec3 half_ = normalize(light + view);
  float nl = max(dot(n, light), 0.0);
  float nh = max(dot(n, half_), 0.0);
  float spec = pow(nh, 110.0) * 1.4 + pow(nh, 16.0) * 0.14;
  vec3 refl = reflect(-view, n);
  float window = smoothstep(0.8, 0.94, dot(normalize(refl), normalize(vec3(-0.35, -0.75, 0.55))));
  float rim = pow(1.0 - n.z, 2.4);

  /* Colour: light from the page shines through thin sauce; thick sauce is dark red. */
  float thick = 2.0 * h;
  vec3 bg = mix(uDark, uCream, smoothstep(SEAM - 1.5, SEAM + 1.5, p.y));
  vec3 sigma = vec3(0.021, 0.098, 0.135);
  vec3 through = bg * exp(-sigma * thick);
  vec3 body = vec3(0.66, 0.05, 0.035) * (0.3 + 0.7 * nl);
  vec3 col = through + body * (1.0 - exp(-0.05 * thick));

  /* Flecks of spice. */
  float fleck = smoothstep(0.84, 0.9, vnoise(p * 1.8 + 4.0)) * smoothstep(3.0, 8.0, h);
  col *= 1.0 - 0.32 * fleck;

  col += vec3(1.0, 0.94, 0.86) * (spec + window * 0.5) * (0.55 + 0.45 * smoothstep(0.0, 8.0, h));
  col += vec3(1.0, 0.42, 0.22) * rim * 0.22 * smoothstep(0.0, 5.0, h);

  vec3 shadowColor = vec3(0.3, 0.035, 0.03);
  float alpha = cover + shadowA * (1.0 - cover);
  vec3 rgb = col * cover + shadowColor * shadowA * (1.0 - cover);
  gl_FragColor = vec4(rgb, alpha);
}
`;

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function SauceCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return;

    const gl = canvas.getContext("webgl", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "low-power",
    });
    if (!gl) return;

    const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
    const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram();
    if (!vertex || !fragment || !program) return;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    // One triangle that covers the whole canvas.
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    gl.clearColor(0, 0, 0, 0);

    const uniform = (name: string) => gl.getUniformLocation(program, name);
    const uSize = uniform("uSize");
    const uDpr = uniform("uDpr");
    const uScale = uniform("uScale");
    const uTime = uniform("uTime");
    const uScroll = uniform("uScroll");
    gl.uniform3fv(uniform("uDark"), DARK);
    gl.uniform3fv(uniform("uCream"), CREAM);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0;
    let scale = 1;
    let dpr = 1;
    let scroll = 0.5;
    let startedAt = 0;
    let started = false;
    let running = false;
    let visible = false;
    let frame = 0;
    let pending = false;
    let lastTime = 0;

    const layout = () => {
      width = host.clientWidth;
      if (width === 0) return;
      scale = Math.min(1.1, Math.max(0.6, width / 1440));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
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
        drips.set([x * width / scale, w, length, delay], i * 4);
        extra.set([duration, bulb, sway, phase], i * 4);
      });
      gl.uniform4fv(uniform("uA"), drips);
      gl.uniform4fv(uniform("uB"), extra);
      gl.uniform2f(uSize, width, height);
      gl.uniform1f(uDpr, dpr);
      gl.uniform1f(uScale, scale);
    };

    const draw = (time: number) => {
      if (width === 0) return;
      lastTime = time;
      gl.uniform1f(uTime, time);
      gl.uniform1f(uScroll, scroll);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      host.setAttribute("data-gl", "");
    };

    const tick = (now: number) => {
      const time = (now - startedAt) / 1000;
      draw(time);
      if (time < TOTAL_SECONDS) frame = requestAnimationFrame(tick);
      else running = false;
    };

    const play = () => {
      started = true;
      if (reduce.matches) {
        draw(99);
        return;
      }
      running = true;
      startedAt = performance.now();
      frame = requestAnimationFrame(tick);
    };

    // The light slides a little as the page scrolls, like moving past something wet.
    const onScroll = () => {
      if (!visible || running || reduce.matches || pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        const box = canvas.getBoundingClientRect();
        scroll = Math.min(1, Math.max(0, 1 - (box.top + box.height / 2) / window.innerHeight));
        draw(Math.max(lastTime, 99));
      });
    };

    layout();
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !started) play();
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(canvas);

    const resizer = new ResizeObserver(() => {
      layout();
      if (started && !running) draw(Math.max(lastTime, 99));
    });
    resizer.observe(host);
    window.addEventListener("scroll", onScroll, { passive: true });

    const lost = (event: Event) => {
      event.preventDefault();
      host.removeAttribute("data-gl");
    };
    canvas.addEventListener("webglcontextlost", lost);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      resizer.disconnect();
      window.removeEventListener("scroll", onScroll);
      canvas.removeEventListener("webglcontextlost", lost);
    };
  }, []);

  return <canvas ref={ref} className="sauce-canvas" aria-hidden="true" />;
}
