"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

type CategoryNavProps = {
  items: { slug: string; name: string }[];
};

/**
 * Sticky jump links for the menu page. Anchors work without JavaScript; the script only
 * highlights the category currently in view and keeps its chip visible on narrow screens.
 */
export function CategoryNav({ items }: CategoryNavProps) {
  const [active, setActive] = useState(items[0]?.slug);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const sections = items
      .map((item) => document.getElementById(item.slug))
      .filter((element): element is HTMLElement => element !== null);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-160px 0px -55% 0px", threshold: 0 },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [items]);

  useEffect(() => {
    const list = listRef.current;
    const chip = list?.querySelector<HTMLElement>(`[data-slug="${active}"]`);
    if (!list || !chip) return;
    list.scrollTo({
      left: chip.offsetLeft - (list.clientWidth - chip.offsetWidth) / 2,
      behavior: "smooth",
    });
  }, [active]);

  return (
    <nav
      aria-label="Menu categories"
      className="sticky top-[var(--header-h)] z-40 border-b border-ink-900/10 bg-bone-100"
    >
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8 lg:px-10">
        <ul ref={listRef} className="flex gap-2 overflow-x-auto py-3 [scrollbar-width:none]">
          {items.map((item) => {
            const isActive = item.slug === active;
            return (
              <li key={item.slug} data-slug={item.slug} className="shrink-0">
                <a
                  href={`#${item.slug}`}
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    "inline-flex h-11 items-center rounded-md px-4 font-display text-[0.8125rem] font-bold uppercase tracking-[0.06em] transition-colors",
                    isActive
                      ? "bg-ink-900 text-bone-50"
                      : "bg-bone-200 text-ink-700 hover:bg-bone-300",
                  )}
                >
                  {item.name}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
