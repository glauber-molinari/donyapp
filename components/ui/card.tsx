import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-ds-xl border border-app-border bg-app-sidebar shadow-ds-sm", className)}
      {...props}
    />
  );
}
