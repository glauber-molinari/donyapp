import { cn } from "@/lib/utils";

export function AdminMetricCard({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-ds-xl border border-app-border bg-app-sidebar p-4 shadow-sm",
        className
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-ds-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-ds-ink">{value}</p>
      {hint ? <p className="mt-2 text-xs text-ds-muted">{hint}</p> : null}
    </div>
  );
}
