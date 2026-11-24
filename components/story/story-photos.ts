/**
 * The four process photos, in the order the story tells them. They are square (the plate is round)
 * and sit in public/images/story/. To use the restaurant's own pictures instead, replace the files
 * with square photos of the same four moments and keep the names.
 */
export const STORY_PHOTOS = [
  {
    key: "dusting",
    src: "/images/story/dusting.webp",
    alt: "A cook sprinkling red spice through a small sieve over raw chicken wings on a wooden board",
  },
  {
    key: "cooking",
    src: "/images/story/cooking.webp",
    alt: "Cooked wings, dark and crisp, in a steel fry basket lined with paper",
  },
  {
    key: "tossing",
    src: "/images/story/tossing.webp",
    alt: "Wings tossed in orange sauce above a steel mixing bowl, drops of sauce flying",
  },
  {
    key: "biting",
    src: "/images/story/biting.webp",
    alt: "Two hands holding a wing with a bite taken out of it, steam rising",
  },
] as const;
