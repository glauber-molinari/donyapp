import { differenceInCalendarDays, parseISO } from "date-fns";

import { cn } from "@/lib/utils";

export type ProximityTone = "danger" | "warn" | "ok" | "muted";

/**
 * Proximidade do prazo final (em dias corridos) usada na lista de jobs do
 * Dashboard e na página do cliente. Mantém rótulo curto + tom semântico.
 */
export function deadlineProximity(deadlineIso: string): {
  label: string;
  tone: ProximityTone;
  days: number | null;
} {
  const days = differenceInCalendarDays(parseISO(deadlineIso), new Date());
  if (Number.isNaN(days)) return { label: "—", tone: "muted", days: null };
  if (days < 0) return { label: `Atrasado ${Math.abs(days)}d`, tone: "danger", days };
  if (days === 0) return { label: "Hoje", tone: "warn", days };
  if (days <= 3) return { label: `Em ${days}d`, tone: "warn", days };
  if (days <= 10) return { label: `Em ${days}d`, tone: "ok", days };
  return { label: `Em ${days}d`, tone: "muted", days };
}

export function ProximityPill({ deadline }: { deadline: string }) {
  const p = deadlineProximity(deadline);
  const base =
    "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium tabular-nums";
  const tone =
    p.tone === "danger"
      ? "border-ds-danger/20 bg-ds-danger-soft text-ds-danger"
      : p.tone === "warn"
        ? "border-ds-warn/20 bg-ds-warn-soft text-ds-warn"
        : p.tone === "ok"
          ? "border-ds-success/20 bg-ds-success-soft text-ds-success"
          : "border-ds-border bg-ds-surface text-ds-muted";

  const progress = (() => {
    if (p.days === null) return 0;
    if (p.days < 0) return 100;
    const capped = Math.min(14, p.days);
    return Math.round(((14 - capped) / 14) * 100);
  })();

  return (
    <span className={cn(base, tone)} title="Quão perto do prazo final está">
      <span className="min-w-[4.25rem]">{p.label}</span>
      <span className="h-1.5 w-12 overflow-hidden rounded-full bg-black/10">
        <span
          className={cn(
            "block h-full rounded-full",
            p.tone === "danger"
              ? "bg-ds-danger"
              : p.tone === "warn"
                ? "bg-ds-warn"
                : p.tone === "ok"
                  ? "bg-ds-success"
                  : "bg-ds-muted-2/60"
          )}
          style={{ inlineSize: `${progress}%` }}
        />
      </span>
    </span>
  );
}
