import { cn } from "@/lib/utils";

export type SegmentedMeterTone =
  | "accent"
  | "success"
  | "warn"
  | "danger"
  | "info"
  | "muted"
  | "load";

export type LoadTone = "success" | "warn" | "danger";

/**
 * Pouco = verde, médio = amarelo, muito = vermelho.
 * Faixas: &lt;34% · 34–66% · &gt;66%.
 */
export function loadToneFromPercent(pct0to100: number): LoadTone {
  if (pct0to100 < 34) return "success";
  if (pct0to100 <= 66) return "warn";
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

/** Preenchimento da progressão de carga (soft, conforme DS). */
const LOAD_FILL_CLASS: Record<LoadTone, string> = {
  success: "bg-[#E2F3EA]", // verde soft
  warn: "bg-[#FBEEDA]", // amarelo soft
  danger: "bg-[#FBE3E3]", // vermelho soft
};

/** Texto/número acompanhando a carga — tom sólido para contraste. */
export const LOAD_TEXT_CLASS: Record<LoadTone, string> = {
  success: "text-ds-success",
  warn: "text-ds-warn",
  danger: "text-ds-danger",
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
  const isLoad = tone === "load";
  const loadTone = isLoad ? loadToneFromPercent(Math.round(pct * 100)) : null;
  const fillClass = isLoad
    ? LOAD_FILL_CLASS[loadTone!]
    : FILL_CLASS[tone];

  const loadRingClass: Record<LoadTone, string> = {
    success: "ring-1 ring-inset ring-ds-success/25",
    warn: "ring-1 ring-inset ring-ds-warn/25",
    danger: "ring-1 ring-inset ring-ds-danger/25",
  };

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
            i < filled
              ? cn(fillClass, loadTone ? loadRingClass[loadTone] : null)
              : "bg-ds-hairline"
          )}
        />
      ))}
    </div>
  );
}
