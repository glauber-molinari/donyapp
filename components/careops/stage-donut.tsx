import { cn } from "@/lib/utils";

export type StageSlice = {
  id: string;
  name: string;
  count: number;
  color: string;
};

/** Donut SVG simples para distribuição por etapa. */
export function StageDonut({
  slices,
  className,
  size = 148,
}: {
  slices: StageSlice[];
  className?: string;
  size?: number;
}) {
  const total = slices.reduce((s, x) => s + x.count, 0);
  const r = 54;
  const c = 2 * Math.PI * r;
  let offset = 0;

  if (total === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-ds-cream text-sm text-ds-muted",
          className
        )}
        style={{ width: size, height: size }}
      >
        Sem dados
      </div>
    );
  }

  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90" aria-hidden>
        <circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke="var(--ds-hairline, #ece8e1)"
          strokeWidth="14"
        />
        {slices
          .filter((s) => s.count > 0)
          .map((s) => {
            const len = (s.count / total) * c;
            const dash = `${len} ${c - len}`;
            const el = (
              <circle
                key={s.id}
                cx="70"
                cy="70"
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth="14"
                strokeDasharray={dash}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            );
            offset += len;
            return el;
          })}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-2xl font-bold tabular-nums text-ds-ink">
          {total}
        </span>
        <span className="max-w-[5.5rem] text-center text-[9px] font-semibold uppercase leading-tight tracking-wider text-ds-muted-2">
          Jobs ativos
        </span>
      </div>
    </div>
  );
}
