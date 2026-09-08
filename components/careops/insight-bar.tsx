import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function InsightBar({
  children,
  href,
  cta = "Abrir quadro",
  className,
}: {
  children: ReactNode;
  href?: string;
  cta?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-[1.125rem] border border-ds-accent/15 bg-gradient-to-r from-ds-accent-soft/90 via-ds-cream to-ds-surface px-4 py-3.5 shadow-ds-sm sm:flex-row sm:items-center sm:justify-between sm:px-5",
        className
      )}
      role="status"
    >
      <div className="min-w-0 text-sm leading-relaxed text-ds-ink-2">{children}</div>
      {href ? (
        <Link
          href={href}
          className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full bg-ds-ink px-3.5 py-2 text-xs font-semibold text-ds-on-dark transition-colors hover:bg-ds-ink-2 sm:self-auto"
        >
          {cta}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      ) : null}
    </div>
  );
}
