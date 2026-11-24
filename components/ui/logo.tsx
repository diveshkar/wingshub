import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import type { MediaImage } from "@/types";

type LogoProps = {
  name: string;
  /** Transparent logo for dark surfaces. Falls back to the plain name until one is supplied. */
  image: MediaImage | null;
  /** Sets the rendered width, for example "w-20". The aspect ratio comes from the image. */
  className?: string;
};

export function Logo({ name, image, className }: LogoProps) {
  if (!image) {
    return (
      <span
        className={cn("font-display text-xl font-black uppercase tracking-tight text-bone-50", className)}
      >
        {name}
      </span>
    );
  }

  return (
    <Image
      src={image.src}
      alt={name}
      width={image.width ?? 512}
      height={image.height ?? 512}
      sizes="160px"
      className={cn("h-auto w-16 shrink-0", className)}
    />
  );
}
