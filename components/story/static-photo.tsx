import { getImageProps } from "next/image";
import type { STORY_PHOTOS } from "./story-photos";

/** Visitors who get no animation: people who asked for less motion, and people with scripts turned off. */
const NO_ANIMATION = "(prefers-reduced-motion: reduce), (scripting: none)";
const SIZES = "15rem";
/** A transparent 1px picture. It is all the <img> loads when a <source> does not match. */
const PLACEHOLDER = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

/**
 * The photo that sits under a caption for visitors who get no animation. Everyone else never sees it
 * (it is hidden by app/story.css), so the browser is told to fetch the real picture only in those two
 * cases. A plain lazy <img> inside a hidden box is not enough: Chrome downloads it anyway.
 */
export function StaticPhoto({ photo }: { photo: (typeof STORY_PHOTOS)[number] }) {
  const { props } = getImageProps({
    src: photo.src,
    alt: photo.alt,
    width: 1200,
    height: 1200,
    sizes: SIZES,
  });

  return (
    <picture>
      <source media={NO_ANIMATION} srcSet={props.srcSet} sizes={SIZES} />
      <img
        src={PLACEHOLDER}
        alt={photo.alt}
        width={1200}
        height={1200}
        decoding="async"
        className="h-auto w-full"
      />
    </picture>
  );
}
