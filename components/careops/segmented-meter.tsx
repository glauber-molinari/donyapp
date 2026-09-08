import { cn } from "@/lib/utils";

/**
 * Medidor segmentado vertical no estilo CareOps
 * (barra de "utilization" com pílulas).
 */
export function SegmentedMeter({
  value,
  max = 100,
  segments = 24,
  className,
  tone = "accent",
}: {
  value: number;
  max?: number;
  segments?: number;
  className?: string;
  tone?: "accent" | "success" | "warn" | "danger" | "info" | "muted";
}) {
  const pct = Math.max(0, Math.min(1, max === 0 ? 0 : value / max));
  const filled = Math.round(pct * segments);

  const fillClass = {
    accent: "bg-ds-accent",
    success: "bg-ds-success",
    warn: "bg-ds-warn",
    danger: "bg-ds-danger",
    info: "bg-ds-info",
    muted: "bg-ds-muted-2",
  }[tone];

  return (
    <div
      className={cn("flex h-2.5 w-full items-stretch gap-[3px]", className)}
      role="meter"
      aria-valuenow={Math.round(pct * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {Array.from({ length: segments }, (_, i) => (
        <span
          key={i}
          className={cn(
            "min-w-0 flex-1 rounded-full transition-colors",
            i < filled ? fillClass : "bg-ds-hairline"
          )}
        />
      ))}
    </div>
  );
}
