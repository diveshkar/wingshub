"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useRef } from "react";
import { ButtonLink } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import type { MediaImage, NavLink } from "@/types";

type MobileNavProps = {
  brandName: string;
  logo: MediaImage | null;
  links: NavLink[];
  cta: NavLink;
  addressLines: string[];
  email: string;
};

/**
 * Full-screen menu built on the native <dialog>: the browser provides the focus trap,
 * Escape-to-close, an inert page behind it and focus restoration for free.
 */
export function MobileNav({ brandName, logo, links, cta, addressLines, email }: MobileNavProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const open = () => {
    dialogRef.current?.showModal();
    closeButtonRef.current?.focus();
  };
  const close = () => dialogRef.current?.close();

  return (
    <>
      <button
        type="button"
        onClick={open}
        aria-label="Open menu"
        aria-haspopup="dialog"
        className="grid size-11 place-items-center rounded-md border border-bone-50/25 text-bone-50 transition-colors hover:bg-bone-50/10 md:hidden"
      >
        <Menu aria-hidden="true" className="size-5" />
      </button>

      <dialog
        ref={dialogRef}
        aria-label="Site menu"
        className="m-0 hidden h-dvh max-h-none w-full max-w-none bg-ink-900 p-0 text-bone-50 open:flex md:!hidden"
      >
        <div className="flex w-full flex-col px-5 pb-8">
          <div className="flex h-[var(--header-h)] items-center justify-between">
            <Link href="/" onClick={close}>
              <Logo name={brandName} image={logo} />
            </Link>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={close}
              aria-label="Close menu"
              className="grid size-11 place-items-center rounded-md border border-bone-50/25 transition-colors hover:bg-bone-50/10"
            >
              <X aria-hidden="true" className="size-5" />
            </button>
          </div>

          <nav aria-label="Mobile" className="mt-4">
            <ul className="border-t border-bone-50/10">
              {links.map((link) => (
                <li key={link.href} className="border-b border-bone-50/10">
                  <Link
                    href={link.href}
                    onClick={close}
                    className="block py-5 font-display text-3xl font-black uppercase tracking-tight transition-colors hover:text-flame-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mt-auto space-y-6">
            <div className="font-serif text-ink-300">
              {addressLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
              <a href={`mailto:${email}`} className="mt-1 block underline underline-offset-4">
                {email}
              </a>
            </div>
            <ButtonLink href={cta.href} onClick={close} size="lg" className="w-full">
              {cta.label}
            </ButtonLink>
          </div>
        </div>
      </dialog>
    </>
  );
}
