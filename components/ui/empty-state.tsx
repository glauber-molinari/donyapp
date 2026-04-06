import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  children,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-ds-xl border border-dashed border-app-border bg-app-sidebar/80 px-6 py-14 text-center",
        className
      )}
    >
      <Icon className="mb-4 h-10 w-10 text-ds-subtle" aria-hidden />
      <h3 className="text-base font-semibold text-ds-ink">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-sm text-sm text-ds-muted">{description}</p>
      ) : null}
      {children ? <div className="mt-6 flex flex-col gap-3">{children}</div> : null}
    </div>
  );
}
