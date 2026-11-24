import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import type { CategoryIcon, MediaImage } from "@/types";
import { CategoryGlyph } from "./category-icon";

type ImagePlaceholderProps = {
  icon?: CategoryIcon;
  className?: string;
};

/** Neutral stand-in shown only when an image slot has no photo yet. */
export function ImagePlaceholder({ icon = "default", className }: ImagePlaceholderProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("absolute inset-0 grid place-items-center bg-ink-800 text-ink-500", className)}
    >
      <CategoryGlyph icon={icon} className="size-10" strokeWidth={1.25} />
    </div>
  );
}

type FoodImageProps = {
  /** Image record from the data layer. Null renders the placeholder. */
  image: MediaImage | null;
  icon?: CategoryIcon;
  /** Responsive `sizes` hint so the browser downloads the smallest adequate file. */
  sizes: string;
  /** Preload for the largest above-the-fold image only. */
  preload?: boolean;
  className?: string;
};

/**
 * Fills its (relatively positioned, aspect-ratio sized) parent. Keeping the ratio on the
 * parent reserves space up front so images never cause layout shift.
 */
export function FoodImage({ image, icon, sizes, preload = false, className }: FoodImageProps) {
  if (!image) return <ImagePlaceholder icon={icon} className={className} />;

  return (
    <Image
      src={image.src}
      alt={image.alt}
      fill
      sizes={sizes}
      preload={preload}
      className={cn("object-cover", className)}
    />
  );
}
