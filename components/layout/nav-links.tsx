"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import type { NavLink } from "@/types";

type NavLinksProps = {
  links: NavLink[];
  className?: string;
};

export function NavLinks({ links, className }: NavLinksProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary" className={className}>
      <ul className="flex items-center gap-2">
        {links.map((link) => {
          const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative block px-3 py-2 font-display text-[0.8125rem] font-bold uppercase tracking-[0.08em] transition-colors",
                  active ? "text-bone-50" : "text-ink-300 hover:text-bone-50",
                )}
              >
                {link.label}
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-3 -bottom-0.5 h-0.5 bg-flame-500"
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
