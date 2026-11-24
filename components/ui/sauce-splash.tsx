import Image from "next/image";
import { cn } from "@/lib/utils/cn";

/**
 * A wings-and-sauce splash for dark title bands. It sits flush with the right edge and fades out
 * towards the text. It only shows from `xl` up: on narrower screens the intro text would run
 * across the picture, so the band stays plain there.
 */
export function SauceSplash({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-y-0 right-0 hidden w-[min(44rem,60%)] xl:block",
        className,
      )}
    >
      <Image
        src="/images/animation/sauce-splash.webp"
        alt=""
        fill
        sizes="(min-width: 1024px) 560px, 40vw"
        fetchPriority="low"
        className="sauce-splash object-contain object-right [mask-image:linear-gradient(to_right,transparent,black_40%)]"
      />
    </div>
  );
}
