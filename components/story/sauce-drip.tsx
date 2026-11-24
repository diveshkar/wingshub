import type { CSSProperties } from "react";

/** Where each drip hangs, how wide it is and how long. */
const DRIPS = [
  { x: "5%", w: "1.4rem", h: "3rem" },
  { x: "15%", w: "1rem", h: "1.9rem" },
  { x: "27%", w: "1.6rem", h: "3.8rem" },
  { x: "40%", w: "1.1rem", h: "2.3rem" },
  { x: "53%", w: "1.5rem", h: "3.3rem" },
  { x: "66%", w: "1rem", h: "2rem" },
  { x: "78%", w: "1.7rem", h: "4rem" },
  { x: "91%", w: "1.2rem", h: "2.5rem" },
];

/**
 * Sauce running down from the bottom of the hero into the next section: the same sauce the
 * wings were just tossed in. The drips grow as the edge scrolls into view.
 */
export function SauceDrip() {
  return (
    <div className="sauce-drip" aria-hidden="true">
      {DRIPS.map((drip) => (
        <i
          key={drip.x}
          style={{ "--x": drip.x, "--w": drip.w, "--h": drip.h } as CSSProperties}
        />
      ))}
    </div>
  );
}
