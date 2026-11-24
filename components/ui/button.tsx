import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "dark" | "light" | "outline-light" | "outline-dark";
type Size = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-md font-display font-bold uppercase tracking-[0.06em] whitespace-nowrap transition-[color,background-color,border-color,box-shadow,translate] duration-150 active:translate-y-px disabled:pointer-events-none disabled:opacity-60";

const variants: Record<Variant, string> = {
  primary:
    "bg-flame-500 text-bone-50 hover:bg-flame-600 hover:shadow-[0_10px_24px_-10px_rgb(229_8_13/0.7)]",
  dark: "bg-ink-900 text-bone-50 hover:bg-ink-700",
  light: "bg-bone-50 text-ink-900 hover:bg-bone-200",
  "outline-light": "border border-bone-50/40 text-bone-50 hover:border-bone-50 hover:bg-bone-50/10",
  "outline-dark":
    "border border-ink-900/35 text-ink-900 hover:border-ink-900 hover:bg-ink-900 hover:text-bone-50",
};

const sizes: Record<Size, string> = {
  md: "h-11 px-5 text-[0.8125rem]",
  lg: "h-12 px-6 text-sm",
};

type StyleOptions = { variant?: Variant; size?: Size; className?: string };

export function buttonStyles({ variant = "primary", size = "md", className }: StyleOptions = {}) {
  return cn(base, variants[variant], sizes[size], className);
}

type ButtonLinkProps = StyleOptions & {
  href: string;
  children: ReactNode;
} & Omit<ComponentProps<"a">, "href" | "className" | "children">;

/** Internal paths use next/link; http(s), mailto and tel use a plain anchor. */
export function ButtonLink({ href, variant, size, className, children, ...rest }: ButtonLinkProps) {
  const classes = buttonStyles({ variant, size, className });

  if (href.startsWith("/") || href.startsWith("#")) {
    return (
      <Link href={href} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  const isWeb = /^https?:/.test(href);
  return (
    <a
      href={href}
      className={classes}
      {...(isWeb ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      {...rest}
    >
      {children}
    </a>
  );
}

type ButtonProps = StyleOptions & {
  children: ReactNode;
} & Omit<ComponentProps<"button">, "className" | "children">;

export function Button({ variant, size, className, children, ...rest }: ButtonProps) {
  return (
    <button className={buttonStyles({ variant, size, className })} {...rest}>
      {children}
    </button>
  );
}
