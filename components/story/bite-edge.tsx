import type { CSSProperties } from "react";

/* One big round bite with a row of small tooth marks along its edge. Sizes are in rem. */
const WIDTH = 7;
const RADIUS = 2.6;
const TOOTH = 1.7;
const ANGLES = [18, 40, 62, 86, 110, 134, 158];

const teeth = ANGLES.map((degrees) => {
  const angle = (degrees * Math.PI) / 180;
  return {
    x: WIDTH / 2 + Math.cos(angle) * RADIUS,
    y: Math.sin(angle) * RADIUS,
  };
});

/**
 * A bite taken out of the top corner of the section it sits in. The circles are the colour of the
 * section above, so the page looks eaten away. It grows as it scrolls into view.
 */
export function BiteEdge() {
  return (
    <div className="bite-edge" aria-hidden="true">
      <i style={{ "--x": `${WIDTH / 2}rem`, "--y": "0rem", "--d": `${RADIUS * 2}rem` } as CSSProperties} />
      {teeth.map((tooth) => (
        <i
          key={tooth.x}
          style={{ "--x": `${tooth.x.toFixed(2)}rem`, "--y": `${tooth.y.toFixed(2)}rem`, "--d": `${TOOTH}rem` } as CSSProperties}
        />
      ))}
    </div>
  );
}
