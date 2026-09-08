import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const toneStyles = {
  accent: {
    icon: "bg-ds-accent-soft text-ds-accent",
  },
  danger: {
    icon: "bg-ds-danger-soft text-ds-danger",
  },
  warn: {
    icon: "bg-ds-warn-soft text-ds-warn",
  },
  success: {
    icon: "bg-ds-success-soft text-ds-success",
  },
  info: {
    icon: "bg-ds-info-soft text-ds-info",
  },
  muted: {
    icon: "bg-ds-cream text-ds-muted",
  },
} as const;

export type MetricTone = keyof typeof toneStyles;

/** Sentimento da variação: sobe/desce pode ser bom ou ruim conforme a métrica. */
export type MetricTrendSentiment = "good" | "bad" | "warn" | "neutral";

export type MetricTrend = {
  direction: "up" | "down" | "flat";
  /** Texto curto: "+2 vs semana" ou "2 na fila". */
  label: string;
  sentiment?: MetricTrendSentiment;
};

const sentimentClass: Record<MetricTrendSentiment, string> = {
  good: "text-ds-success bg-ds-success-soft/80",
  bad: "text-ds-danger bg-ds-danger-soft/80",
  warn: "text-ds-warn bg-ds-warn-soft/80",
  neutral: "text-ds-muted bg-ds-cream",
};

function TrendBadge({ trend }: { trend: MetricTrend }) {
  const sentiment = trend.sentiment ?? "neutral";
  const Icon =
    trend.direction === "up"
      ? ArrowUpRight
      : trend.direction === "down"
        ? ArrowDownRight
        : Minus;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold tabular-nums",
        sentimentClass[sentiment]
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {trend.label}
    </span>
  );
}

export function MetricTile({
  label,
  value,
  hint,
  icon: Icon,
  tone = "accent",
  trend,
  className,
  footer,
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon: LucideIcon;
  tone?: MetricTone;
  /** Seta + texto com comparação ou aviso real (substitui sparkline decorativo). */
  trend?: MetricTrend;
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
      {trend ? (
        <div className="mt-3">
          <TrendBadge trend={trend} />
        </div>
      ) : null}
      {footer ? <div className="mt-3">{footer}</div> : null}
    </div>
  );
}
