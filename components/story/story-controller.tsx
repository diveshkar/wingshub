"use client";

import { useEffect } from "react";

/**
 * Turns the visitor's scroll position into the look of every part of the plate.
 *
 * The story is measured in "beats", s = 0 to 4.3, and there is one caption and one photo per beat:
 *   0 - 1   the tossing photo (its wings have just dropped into the bowl) opens onto the dusting photo; spice falls
 *   1 - 2   steam clouds over and the plate becomes the cooked wings in the basket
 *   2 - 3   a splash of sauce sweeps in and the plate becomes the toss: the wings climb back out of the bowl
 *   3 - 4.3 three bites eat the toss away, and what is underneath is the bitten wing
 * Nothing here moves anything itself. It only writes numbers; app/story.css decides how they look.
 *
 * Each number is written only onto the element that uses it (see SCOPES and the data-scope attributes
 * in story-stage.tsx and story-scenes.tsx). A custom property that changes on a parent makes the
 * browser re-check every element below it, so writing them on the whole stage would cost more the
 * more particles there are. The two values that move the whole window are written as plain styles.
 */

const S_MAX = 4.3;

const clamp = (value: number, low = 0, high = 1) => Math.min(high, Math.max(low, value));
/** 0 before a, 1 after b, a straight line in between. */
const seg = (s: number, a: number, b: number) => clamp((s - a) / (b - a));
/** Eases in and out. */
const ease = (t: number) => t * t * (3 - 2 * t);
/** 0 to 1 and back to 0. */
const hump = (t: number) => Math.sin(Math.PI * t);

/** Where each bite starts and ends. */
const BITES = [
  [3.0, 3.18],
  [3.28, 3.46],
  [3.56, 3.72],
] as const;

type Scene = Record<string, number>;

function scene(s: number): Scene {
  const bite = BITES.map(([from, to]) => ease(seg(s, from, to)));
  // Each bite tugs the picture a little as it is torn off.
  const tug = BITES.reduce((sum, [from]) => sum + hump(seg(s, from, from + 0.12)), 0);

  return {
    // The dusting photo opens like an iris from the sieve.
    t1: ease(seg(s, 0.05, 0.4)),
    dust: seg(s, 0.1, 1.2),
    spice: seg(s, 0.28, 1.05),
    "spice-a": ease(seg(s, 0.28, 0.42)) * (1 - ease(seg(s, 0.95, 1.1))),

    // Steam clouds over while the basket photo fades in.
    t2: ease(seg(s, 1, 1.4)),
    veil: hump(seg(s, 1, 1.4)),
    cook: seg(s, 1, 2.1),
    steam1: ease(seg(s, 1.2, 1.5)) * (1 - ease(seg(s, 2.05, 2.4))),

    // A flash of sauce while the tossing photo fades in; the wings climb out of the bowl and sauce flies.
    t3: ease(seg(s, 2, 2.4)),
    flash: hump(seg(s, 2, 2.4)),
    toss: seg(s, 2, 3.1),
    rise: ease(seg(s, 2.2, 2.95)),
    splash: seg(s, 2.2, 2.95),

    // The bites.
    "bite-vis": ease(seg(s, 2.96, 3.04)),
    bite1: bite[0],
    bite2: bite[1],
    bite3: bite[2],
    tug,
    bitek: seg(s, 2.96, 4.3),
    crumb1: seg(s, 3.08, 3.4),
    crumb2: seg(s, 3.36, 3.68),
    crumb3: seg(s, 3.64, 4.1),
    steam2: ease(seg(s, 3.7, 4)),
  };
}

/** Which custom properties go on which element (matched by its data-scope attribute). */
const SCOPES: Record<string, string[]> = {
  dust: ["t1", "dust"],
  cook: ["t2", "cook"],
  bite: ["bite-vis", "bitek"],
  toss: ["t3", "toss", "rise", "splash", "bite1", "bite2", "bite3"],
  veil: ["veil"],
  flash: ["flash"],
  specks: ["spice", "spice-a"],
  "steam-cook": ["steam1"],
  "steam-bite": ["steam2"],
  "crumbs-1": ["crumb1"],
  "crumbs-2": ["crumb2"],
  "crumbs-3": ["crumb3"],
};

export function StoryController() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-story]");
    const stage = root?.querySelector<HTMLElement>("[data-story-stage]");
    const lens = root?.querySelector<HTMLElement>("[data-lens]");
    const track = root?.querySelector<HTMLElement>("[data-story-track]");
    const captions = root?.querySelector<HTMLElement>("[data-story-captions]");
    if (!root || !stage || !lens || !track || !captions) return;

    // Visitors who ask for less motion keep the finished plate and plain captions.
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)");

    let start = 0;
    let length = 1;
    let currentStep = "";
    let currentTug = "";
    let written = new WeakMap<HTMLElement, Map<string, string>>();
    const found = new Map<string, HTMLElement>();

    // Some scopes (the photos) only exist once the page is idle, so look for them until they appear.
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

      // The little tug of each bite moves the whole window, so it is a plain style, not a variable.
      const tug = values.tug.toFixed(3);
      if (tug !== currentTug) {
        currentTug = tug;
        lens.style.rotate = `${(-values.tug * 1.1).toFixed(3)}deg`;
        lens.style.scale = (1 - values.tug * 0.012).toFixed(4);
      }

      const step = s < 0.02 ? "-1" : String(Math.min(3, Math.floor(s)));
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
        lens.style.removeProperty("rotate");
        lens.style.removeProperty("scale");
        written = new WeakMap();
        found.clear();
        currentStep = "";
        currentTug = "";
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
