"use client";

import { useEffect, useRef } from "react";
import { createBanner } from "./sauce-banner";

/** How long the sauce takes to pour and run, in seconds. */
const SECONDS = 3.9;

/**
 * Draws the sauce banner (components/story/sauce-banner.ts) when it scrolls into view. It runs for a few
 * seconds and then rests; after that only the light slides a little as the page scrolls. With reduced motion
 * it is drawn once, finished. The CSS drips next to it stay on screen until the first drawing, and for good
 * where WebGL is missing.
 */
export function SauceCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return;

    const banner = createBanner(host, canvas);
    if (!banner) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let started = false;
    let running = false;
    let visible = false;
    let frame = 0;
    let pending = false;
    let startedAt = 0;
    let scroll = 0.5;

    const draw = (t: number) => {
      banner.draw(t, scroll);
      host.setAttribute("data-gl", "");
    };

    const tick = (now: number) => {
      const t = (now - startedAt) / 1000;
      draw(t);
      if (t < SECONDS) frame = requestAnimationFrame(tick);
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
      if (!started || !visible || running || reduce.matches || pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        const box = canvas.getBoundingClientRect();
        scroll = Math.min(1, Math.max(0, 1 - (box.top + box.height / 2) / window.innerHeight));
        draw(99);
      });
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !started) play();
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(canvas);

    const resizer = new ResizeObserver(() => {
      banner.resize();
      if (started && !running) draw(99);
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
      banner.dispose();
    };
  }, []);

  return <canvas ref={ref} className="sauce-canvas" aria-hidden="true" />;
}
