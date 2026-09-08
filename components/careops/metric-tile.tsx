import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Sparkline } from "@/components/careops/sparkline";
import { cn } from "@/lib/utils";

const toneStyles = {
  accent: {
    icon: "bg-ds-accent-soft text-ds-accent",
    spark: "text-ds-accent",
    fill: "rgba(255,85,0,0.18)",
  },
  danger: {
    icon: "bg-ds-danger-soft text-ds-danger",
    spark: "text-ds-danger",
    fill: "rgba(196,56,56,0.16)",
  },
  warn: {
    icon: "bg-ds-warn-soft text-ds-warn",
    spark: "text-ds-warn",
    fill: "rgba(185,119,0,0.16)",
  },
  success: {
    icon: "bg-ds-success-soft text-ds-success",
    spark: "text-ds-success",
    fill: "rgba(31,138,91,0.16)",
  },
  info: {
    icon: "bg-ds-info-soft text-ds-info",
    spark: "text-ds-info",
    fill: "rgba(42,111,219,0.16)",
  },
  muted: {
    icon: "bg-ds-cream text-ds-muted",
    spark: "text-ds-muted",
    fill: "rgba(107,102,96,0.12)",
  },
} as const;

export type MetricTone = keyof typeof toneStyles;

export function MetricTile({
  label,
  value,
  hint,
  icon: Icon,
  tone = "accent",
  sparkValues,
  className,
  footer,
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon: LucideIcon;
  tone?: MetricTone;
  sparkValues?: number[];
  className?: string;
  footer?: ReactNode;
}) {
  const t = toneStyles[tone];

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-[1.125rem] border border-ds-border/70 bg-ds-surface p-4 shadow-ds-md transition-[box-shadow,transform] duration-ds-fast hover:-translate-y-0.5 hover:shadow-ds-lg",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ds-muted-2">
            {label}
          </p>
          <p className="mt-1.5 font-display text-3xl font-bold tabular-nums tracking-tight text-ds-ink">
            {value}
          </p>
          {hint ? (
            <p className="mt-1 text-xs leading-snug text-ds-muted">{hint}</p>
          ) : null}
        </div>
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
            t.icon
          )}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </div>
      </div>
      {sparkValues && sparkValues.length > 1 ? (
        <div className={cn("mt-3", t.spark)}>
          <Sparkline values={sparkValues} fill={t.fill} stroke="currentColor" />
        </div>
      ) : null}
      {footer ? <div className="mt-3">{footer}</div> : null}
    </div>
  );
}
