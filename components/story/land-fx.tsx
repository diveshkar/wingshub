"use client";

import { useEffect, useRef } from "react";
import { createSim, draw, isDone, settle, step } from "./land-sim";

/** How many stage widths the canvas covers across and down (it is centred on the plate, see .land-fx in app/story.css). */
const SPAN_X = 1.8;
const SPAN_Y = 1.2;

/**
 * The crumbs and flecks of sauce that jump out of the board when the two wings land on it, drawn on a
 * canvas by land-sim.ts. The wings themselves are CSS (app/story.css); this is timed to their touchdown by
 * starting from the moment their animation starts. It runs for about two seconds and then stops, and the
 * crumbs that have come to rest stay on the board until the plate stands up.
 *
 * The hero section says what to do through its data-intro attribute: "go" plays the landing, "done" draws
 * the finished board at once (a visit that has already seen it), anything else waits. Visitors who asked
 * for less motion never get this layer at all.
 */
export function LandFx() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const section = canvas?.closest<HTMLElement>("[data-story]");
    const stage = canvas?.closest<HTMLElement>("[data-story-stage]");
    const context = canvas?.getContext("2d");
    if (!canvas || !section || !stage || !context) return;
    const surface: HTMLCanvasElement = canvas;
    const pen: CanvasRenderingContext2D = context;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let sim = createSim();
    let frame = 0;
    let started = false;
    let origin = 0;
    let unit = 1;

    const paint = () => draw(pen, sim, { width: surface.width, height: surface.height, unit });

    const resize = () => {
      const width = stage.clientWidth || 1;
      const ratio = Math.min(window.devicePixelRatio || 1, 1.75);
      unit = width * ratio;
      surface.width = Math.round(width * SPAN_X * ratio);
      surface.height = Math.round(width * SPAN_Y * ratio);
      paint();
    };

    // The clock decides how far the crumbs have got, so a slow frame never makes them late.
    const loop = (now: number) => {
      const until = (now - origin) / 1000;
      for (let i = 0; i < 600 && sim.t < until && !isDone(sim); i++) step(sim);
      paint();
      if (!isDone(sim)) frame = requestAnimationFrame(loop);
    };

    const run = () => {
      const mode = section.dataset.intro;
      if (mode === "done") {
        sim = createSim();
        settle(sim);
        paint();
      } else if (mode === "go" && !started) {
        started = true;
        sim = createSim();
        frame = requestAnimationFrame((now) => {
          // Start from the moment the wings' own animation started, so the crumbs meet them.
          const animation = stage.querySelector(".land-wing-a")?.getAnimations?.()[0];
          origin = typeof animation?.startTime === "number" ? animation.startTime : now;
          loop(now);
        });
      }
    };

    resize();
    run();
    const watcher = new MutationObserver(run);
    watcher.observe(section, { attributes: true, attributeFilter: ["data-intro"] });
    const sizer = new ResizeObserver(resize);
    sizer.observe(stage);

    return () => {
      cancelAnimationFrame(frame);
      watcher.disconnect();
      sizer.disconnect();
    };
  }, []);

  return <canvas ref={ref} className="land-fx" aria-hidden="true" />;
}
