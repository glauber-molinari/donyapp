import { cn } from "@/lib/utils";

export type SegmentedMeterTone =
  | "accent"
  | "success"
  | "warn"
  | "danger"
  | "info"
  | "muted"
  | "load";

/**
 * Pouco = verde, médio = laranja, muito = vermelho.
 * Faixas: &lt;34% success · 34–66% accent · &gt;66% danger.
 */
export function loadToneFromPercent(pct0to100: number): Exclude<SegmentedMeterTone, "load"> {
  if (pct0to100 < 34) return "success";
  if (pct0to100 <= 66) return "accent";
  return "danger";
}

const FILL_CLASS: Record<Exclude<SegmentedMeterTone, "load">, string> = {
  accent: "bg-ds-accent",
  success: "bg-ds-success",
  warn: "bg-ds-warn",
  danger: "bg-ds-danger",
  info: "bg-ds-info",
  muted: "bg-ds-muted-2",
};

export const LOAD_TEXT_CLASS: Record<
  Exclude<SegmentedMeterTone, "load">,
  string
> = {
  accent: "text-ds-accent",
  success: "text-ds-success",
  warn: "text-ds-warn",
  danger: "text-ds-danger",
  info: "text-ds-info",
  muted: "text-ds-muted",
};

/**
 * Medidor segmentado no estilo CareOps
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
  tone?: SegmentedMeterTone;
}) {
  const pct = Math.max(0, Math.min(1, max === 0 ? 0 : value / max));
  const filled = Math.round(pct * segments);
  const resolved =
    tone === "load" ? loadToneFromPercent(Math.round(pct * 100)) : tone;

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
            i < filled ? FILL_CLASS[resolved] : "bg-ds-hairline"
          )}
        />
      ))}
    </div>
  );
}
