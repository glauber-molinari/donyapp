import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-ds-card border border-ds-border bg-ds-surface shadow-ds-sm",
        className
      )}
      {...props}
    />
  );
}
