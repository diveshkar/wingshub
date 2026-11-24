import { siteConfig } from "@/config/site";

/** Visible only until NEXT_PUBLIC_CONTENT_STATUS=live, so unfinished content is never mistaken for the real thing. */
export function DraftBanner() {
  if (siteConfig.isLive) return null;

  return (
    <div role="note" className="bg-honey-400 px-4 py-2 text-center text-[0.8125rem] font-semibold text-ink-950">
      Draft preview: this site is not published yet.
    </div>
  );
}
