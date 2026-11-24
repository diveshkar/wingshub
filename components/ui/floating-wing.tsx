import Image from "next/image";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils/cn";

type FloatingWingProps = {
  /** A cut-out with a transparent background (WebP or PNG). */
  src: string;
  width: number;
  height: number;
  /** Responsive `sizes` hint, matching the width given in `className`. */
  sizes: string;
  /** Position and width, relative to the nearest positioned parent. */
  className?: string;
  /** Resting tilt in degrees. */
  tilt?: number;
  /** Seconds before it flies in. */
  delay?: number;
  /** Seconds for one drift up and down. Different values keep two wings from moving in step. */
  duration?: number;
};

/** A decorative cut-out that flies in, settles and drifts. Hidden from assistive technology. */
export function FloatingWing({
  src,
  width,
  height,
  sizes,
  className,
  tilt = 0,
  delay = 0.4,
  duration = 7,
}: FloatingWingProps) {
  const style = {
    "--tilt": `${tilt}deg`,
    "--delay": `${delay}s`,
    "--duration": `${duration}s`,
  } as CSSProperties;

  return (
    <div
      aria-hidden="true"
      style={style}
      className={cn("pointer-events-none absolute select-none", className)}
    >
      <Image
        src={src}
        alt=""
        width={width}
        height={height}
        sizes={sizes}
        fetchPriority="low"
        className="wing-float h-auto w-full"
      />
    </div>
  );
}
