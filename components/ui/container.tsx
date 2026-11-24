import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type ContainerProps = {
  as?: ElementType;
  className?: string;
  children: ReactNode;
};

/** One content width and one set of side gutters for the whole site. */
export function Container({ as: Tag = "div", className, children }: ContainerProps) {
  return (
    <Tag className={cn("mx-auto w-full max-w-[1200px] px-5 sm:px-8 lg:px-10", className)}>
      {children}
    </Tag>
  );
}
