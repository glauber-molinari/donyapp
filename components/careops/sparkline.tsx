import { cn } from "@/lib/utils";

/** Mini gráfico de linha em SVG puro (estilo CareOps). */
export function Sparkline({
  values,
  className,
  stroke = "currentColor",
  fill = "none",
}: {
  values: number[];
  className?: string;
  stroke?: string;
  fill?: string;
}) {
  const w = 120;
  const h = 36;
  const pad = 2;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);

  const points = values.map((v, i) => {
    const x = pad + (i / Math.max(values.length - 1, 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  });

  const line = points.join(" ");
  const area =
    values.length > 1
      ? `M ${points[0]} L ${points.slice(1).join(" L ")} L ${w - pad},${h - pad} L ${pad},${h - pad} Z`
      : "";

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={cn("h-9 w-full overflow-visible", className)}
      aria-hidden
    >
      {fill !== "none" && area ? (
        <path d={area} fill={fill} opacity={0.35} />
      ) : null}
      <polyline
        points={line}
        fill="none"
        stroke={stroke}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
