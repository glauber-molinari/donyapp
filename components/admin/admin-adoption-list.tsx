import { formatPercentRatio } from "@/lib/admin/format";
import type { AdminAdoptionRow } from "@/lib/admin/usage";

export function AdminAdoptionList({
  rows,
  total,
}: {
  rows: AdminAdoptionRow[];
  total: number;
}) {
  const denom = Math.max(total, 1);

  return (
    <section className="rounded-ds-xl border border-ds-border bg-ds-surface p-4 shadow-ds-sm sm:p-5">
      <h3 className="text-sm font-semibold text-ds-ink">Adoção de recursos</h3>
      <p className="mt-1 text-sm text-ds-muted">
        Das {total} contas com alguém na equipe, quantas já usaram cada recurso. Sem dado de
        cliente.
      </p>
      <ul className="mt-4 flex flex-col gap-3">
        {rows.map((row) => {
          const ratio = row.used / denom;
          const pct = Math.round(ratio * 100);
          return (
            <li key={row.key}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="font-medium text-ds-ink">{row.label}</p>
                  <p className="text-xs text-ds-muted">{row.hint}</p>
                </div>
                <p className="shrink-0 tabular-nums text-ds-ink">
                  {row.used}
                  <span className="ml-1.5 text-xs text-ds-muted">{formatPercentRatio(ratio)}</span>
                </p>
              </div>
              <div
                className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ds-hairline"
                aria-hidden
              >
                <div
                  className="h-full rounded-full bg-ds-ink"
                  style={{ inlineSize: `${Math.max(row.used > 0 ? 4 : 0, pct)}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
