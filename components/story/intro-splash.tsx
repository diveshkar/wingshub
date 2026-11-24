"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { createSauce } from "./intro-sauce";

/* Milliseconds after the wings start to move. These match the timeline in app/story.css (the "full-screen opening" part). */
const IMPACT = 1250;
/** The plate behind may start its own animation (the screen is still covered at this point). */
const GO = 2800;
/** The overlay is taken away. */
const END = 3500;

/** True once the opening has played in this page load, so moving around the site does not replay it. */
let played = false;

const WINGS = [
  { id: "a", src: "/images/intro/wing-a.webp", width: 370, height: 327 },
  { id: "b", src: "/images/intro/wing-b.webp", width: 385, height: 462 },
] as const;

/** The sauce is only decoration: if the graphics card refuses it, the opening goes on without it. */
function startSauce(canvas: HTMLCanvasElement, onLost: () => void) {
  try {
    return createSauce(canvas, onLost);
  } catch {
    return null;
  }
}

/**
 * The first thing a visitor sees: the whole screen goes dark and two big fried wings fly in from opposite
 * sides, hit each other in the middle, and thick glossy sauce bursts out across the screen, splatters on the
 * "lens" and spreads over everything. Then it runs down the screen and uncovers the page, where the plate
 * settles into place (see app/story.css) and the scroll story begins.
 *
 * The wings are cut out of the same photograph, so their light and colour agree, and they sit on a backdrop
 * made from that photograph's own dark kitchen. The sauce is drawn by components/story/intro-sauce.ts.
 * It is skipped for visitors who asked for less motion or to save data, for anyone who has already scrolled,
 * and after the first time in a visit. A tap, key press or scroll skips it. If anything goes wrong the CSS
 * removes the overlay by itself after a few seconds (see the end of app/story.css).
 */
export function IntroSplash() {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const element = root.current;
    const surface = canvas.current;
    const section = document.querySelector<HTMLElement>("[data-story]");
    if (!element || !surface) return;
    const overlay: HTMLDivElement = element;

    const go = () => {
      if (section) section.dataset.intro = "go";
    };

    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    // Adding ?intro to the address plays it again (handy for showing the owner).
    const forced = new URLSearchParams(window.location.search).has("intro");
    // On a real connection, a page that took more than 4.5 s to wake up has been showing the dark cover for
    // too long already, so the opening is dropped. (The development server is always slow at first.)
    const late = process.env.NODE_ENV === "production" && performance.now() > 4500;
    const skipFromTheStart =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      (!forced && (played || connection?.saveData || window.scrollY > 40 || late));

    if (skipFromTheStart) {
      overlay.dataset.state = "done";
      go();
      return;
    }

    let cancelled = false;
    let frame = 0;
    const timers: number[] = [];
    const sauce = startSauce(surface, () => {
      overlay.dataset.gl = "no";
    });
    if (!sauce) overlay.dataset.gl = "no";

    const quiet = () => {
      cancelAnimationFrame(frame);
      timers.forEach(window.clearTimeout);
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("keydown", skip);
      window.removeEventListener("wheel", skip);
      window.removeEventListener("scroll", onScroll);
    };

    const stop = () => {
      cancelled = true;
      quiet();
      window.removeEventListener("resize", onResize);
      sauce?.dispose();
    };

    const finish = () => {
      played = true;
      stop();
      sauce?.release();
      overlay.dataset.state = "done";
      go();
    };

    function skip() {
      if (cancelled) return;
      played = true;
      stop();
      overlay.dataset.state = "out";
      go();
      window.setTimeout(() => {
        sauce?.release();
        overlay.dataset.state = "done";
      }, 300);
    }

    function onResize() {
      sauce?.resize();
    }

    // A small scroll is the browser putting the page back where it was; only a real one skips the opening.
    const startY = window.scrollY;
    function onScroll() {
      if (Math.abs(window.scrollY - startY) > 24) skip();
    }

    const images = Array.from(overlay.querySelectorAll("img"));
    const decoded = Promise.all(images.map((image) => image.decode().catch(() => undefined)));
    const timeout = new Promise((resolve) => window.setTimeout(resolve, 2200));

    Promise.race([decoded, timeout]).then(() => {
      if (cancelled) return;

      overlay.dataset.state = "play";
      window.addEventListener("resize", onResize);
      window.addEventListener("pointerdown", skip, { passive: true });
      window.addEventListener("keydown", skip);
      window.addEventListener("wheel", skip, { passive: true });
      window.addEventListener("scroll", onScroll, { passive: true });

      // Take the start time from the wing's own animation so the sauce is in step with it.
      let start = performance.now();
      const loop = (now: number) => {
        sauce?.draw((now - start - IMPACT) / 1000);
        if (now - start < END) frame = requestAnimationFrame(loop);
      };
      frame = requestAnimationFrame((now) => {
        const animation = overlay.querySelector(".intro-wing-a")?.getAnimations?.()[0];
        if (typeof animation?.startTime === "number") start = animation.startTime;
        else start = now;
        loop(now);
      });

      timers.push(window.setTimeout(go, GO), window.setTimeout(finish, END));
    });

    return () => {
      stop();
    };
  }, []);

  return (
    <div ref={root} className="intro" data-state="idle" aria-hidden="true">
      <svg className="intro-defs" width="0" height="0" focusable="false">
        <filter id="intro-blur" x="-25%" y="-25%" width="150%" height="150%" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation="10 1.6" />
        </filter>
      </svg>

      <div className="intro-scene">
        <div className="intro-backdrop" />
        <div className="intro-glow" />
        {WINGS.map((wing) => (
          <div key={wing.id} className={`intro-wing intro-wing-${wing.id}`}>
            <div className="intro-layer">
              <Image src={wing.src} alt="" width={wing.width} height={wing.height} unoptimized priority />
            </div>
            <div className="intro-layer intro-layer-blur">
              <Image src={wing.src} alt="" width={wing.width} height={wing.height} unoptimized loading="eager" />
            </div>
          </div>
        ))}
      </div>

      <canvas ref={canvas} className="intro-sauce" />
      <div className="intro-flash" />
      <div className="intro-vignette" />
      <noscript>
        <style>{".intro{display:none!important}"}</style>
      </noscript>
    </div>
  );
}
