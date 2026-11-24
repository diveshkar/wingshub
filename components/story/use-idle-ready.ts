"use client";

import { useEffect, useState } from "react";

/**
 * True once the page has finished loading and the browser is idle. The extra photos of the wing story
 * wait for this, so they never compete with the first view. It stays false for visitors who asked for
 * less motion or to save data: they get plain photos under the captions instead.
 */
export function useIdleReady() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || connection?.saveData) return;

    let cancelled = false;
    const show = () => {
      if (!cancelled) setReady(true);
    };
    const schedule = () => {
      // Safari has no requestIdleCallback, so it gets a short timer instead.
      if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(show, { timeout: 2500 });
      else window.setTimeout(show, 1500);
    };

    if (document.readyState === "complete") schedule();
    else window.addEventListener("load", schedule, { once: true });

    return () => {
      cancelled = true;
      window.removeEventListener("load", schedule);
    };
  }, []);

  return ready;
}
