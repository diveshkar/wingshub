"use client";

import { useEffect } from "react";

/**
 * Turns the visitor's scroll position into the look of every part of the plate.
 *
 * The story is measured in "beats", s = 0 to 4.3, and there is one caption per beat:
 *   0 - 1   the plate stands up and turns round (the board with the two wings becomes the dusting photo
 *           in a round window); the photo slowly pushes in and spice falls
 *   1 - 4.3 the plate stays as it is while the next three captions go by
 * Nothing here moves anything itself. It only writes numbers; app/story.css decides how they look.
 *
 * Each number is written only onto the element that uses it (see SCOPES and the data-scope attributes
 * in story-stage.tsx). A custom property that changes on a parent makes the browser re-check every
 * element below it, so writing them on the whole stage would cost more the more particles there are.
 */

const S_MAX = 4.3;

const clamp = (value: number, low = 0, high = 1) => Math.min(high, Math.max(low, value));
/** 0 before a, 1 after b, a straight line in between. */
const seg = (s: number, a: number, b: number) => clamp((s - a) / (b - a));
/** Eases in and out. */
const ease = (t: number) => t * t * (3 - 2 * t);

type Scene = Record<string, number>;

function scene(s: number): Scene {
  return {
    // The plate stands up: 1 = lying on the table as a wide board with the wings on it, 0 = upright and
    // round. Everything that is made of the board (its shape, its tilt, the wings, the photo
    // fading in) reads this one number (see the "flat" rules in app/story.css).
    flat: 1 - ease(seg(s, 0, 0.32)),

    // The photo slowly pushes in while the plate is on screen, and the spice falls from the sieve.
    dust: seg(s, 0.2, 1.2),
    spice: seg(s, 0.4, 1.05),
    "spice-a": ease(seg(s, 0.4, 0.55)) * (1 - ease(seg(s, 0.95, 1.1))),
  };
}

/** Which custom properties go on which element (matched by its data-scope attribute). */
const SCOPES: Record<string, string[]> = {
  tilt: ["flat"],
  lens: ["flat"],
  rim: ["flat"],
  board: ["flat"],
  photo: ["flat", "dust"],
  land: ["flat"],
  shadow: ["flat"],
  bshadow: ["flat"],
  specks: ["spice", "spice-a"],
};

export function StoryController() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-story]");
    const stage = root?.querySelector<HTMLElement>("[data-story-stage]");
    const track = root?.querySelector<HTMLElement>("[data-story-track]");
    const captions = root?.querySelector<HTMLElement>("[data-story-captions]");
    if (!root || !stage || !track || !captions) return;

    // Visitors who ask for less motion keep the finished plate and plain captions.
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)");

    let start = 0;
    let length = 1;
    let currentStep = "";
    let written = new WeakMap<HTMLElement, Map<string, string>>();
    const found = new Map<string, HTMLElement>();

    // Looked up the first time they are needed, then remembered.
    const target = (scope: string) => {
      let element = found.get(scope);
      if (!element) {
        element = root.querySelector<HTMLElement>(`[data-scope="${scope}"]`) ?? undefined;
        if (element) found.set(scope, element);
      }
      return element;
    };

    // Measured once per resize, never while scrolling, so scrolling never forces a layout.
    const measure = () => {
      const trackTop = track.getBoundingClientRect().top + window.scrollY;
      const stickAt = parseFloat(getComputedStyle(captions).top) || 0;
      const captionHeight = captions.getBoundingClientRect().height;
      const lead = captionHeight * 0.35;
      start = trackTop - stickAt - lead;
      length = Math.max(1, track.offsetHeight - captionHeight + lead);
    };

    const render = () => {
      if (calm.matches) return;
      const s = S_MAX * clamp((window.scrollY - start) / length);
      const values = scene(s);

      for (const [scope, names] of Object.entries(SCOPES)) {
        const element = target(scope);
        if (!element) continue;
        let done = written.get(element);
        if (!done) written.set(element, (done = new Map()));
        for (const name of names) {
          const text = values[name].toFixed(4);
          if (done.get(name) !== text) {
            done.set(name, text);
            element.style.setProperty(`--${name}`, text);
          }
        }
      }

      // The first caption waits until the plate has stood up and the dish is showing.
      const step = s < 0.14 ? "-1" : String(Math.min(3, Math.floor(s)));
      if (step !== currentStep) {
        currentStep = step;
        root.dataset.step = step;
      }
    };

    const refresh = () => {
      if (calm.matches) return;
      measure();
      render();
    };

    // The setting can be switched while the page is open: put the plate back to rest, or start moving it.
    const onPreferenceChange = () => {
      if (calm.matches) {
        for (const [scope, names] of Object.entries(SCOPES)) {
          const element = found.get(scope);
          if (element) for (const name of names) element.style.removeProperty(`--${name}`);
        }
        written = new WeakMap();
        found.clear();
        currentStep = "";
        root.dataset.step = "-1";
      } else {
        refresh();
      }
    };

    refresh();
    window.addEventListener("scroll", render, { passive: true });
    window.addEventListener("resize", refresh);
    calm.addEventListener("change", onPreferenceChange);
    const observer = new ResizeObserver(refresh);
    observer.observe(root);

    return () => {
      window.removeEventListener("scroll", render);
      window.removeEventListener("resize", refresh);
      calm.removeEventListener("change", onPreferenceChange);
      observer.disconnect();
    };
  }, []);

  return null;
}
