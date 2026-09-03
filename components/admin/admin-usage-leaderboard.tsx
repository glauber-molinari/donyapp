import { SemanticBadge } from "@/components/ui/badge";
import { formatDatePtBr, formatDaysAgoPtBr } from "@/lib/admin/format";
import type { AdminUsageLeaderRow } from "@/lib/admin/usage";

function planTone(plan: AdminUsageLeaderRow["plan"]): "ink" | "default" {
  return plan === "pro" ? "ink" : "default";
}

function planLabel(plan: AdminUsageLeaderRow["plan"]): string {
  if (plan === "pro") return "Pro";
  if (plan === "free") return "Free";
  return "—";
}

export function AdminUsageLeaderboard({
  title,
  description,
  rows,
  sortKey,
  empty,
}: {
  title: string;
  description: string;
  rows: AdminUsageLeaderRow[];
  sortKey: "jobsTotal" | "jobsTouched30d";
  empty: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r[sortKey]));

  return (
    <section className="rounded-ds-xl border border-ds-border bg-ds-surface p-4 shadow-ds-sm sm:p-5">
      <h3 className="text-sm font-semibold text-ds-ink">{title}</h3>
      <p className="mt-1 text-sm text-ds-muted">{description}</p>

      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-ds-muted">{empty}</p>
      ) : (
        <ol className="mt-4 flex flex-col gap-3">
          {rows.map((row, i) => {
            const value = row[sortKey];
            const width = Math.max(6, Math.round((value / max) * 100));
            return (
              <li key={row.accountId}>
                <div className="flex items-baseline justify-between gap-3">
                  <div className="min-w-0">
                    <p
                      className="truncate text-sm font-medium text-ds-ink"
                      title={`Conta desde ${formatDatePtBr(row.accountCreatedAt)}`}
                    >
                      <span className="mr-2 tabular-nums text-ds-muted-2">{i + 1}.</span>
                      {row.studioName}
                    </p>
                    <p className="mt-0.5 text-xs text-ds-muted">
                      {sortKey === "jobsTotal" ? (
                        <>
                          {row.jobsTouched30d} mexidos nos últimos 30 dias
                          {row.jobs30d > 0 ? ` · ${row.jobs30d} novos` : null}
                          {row.jobsInProgress > 0
                            ? ` · ${row.jobsInProgress} em andamento`
                            : null}
                          {row.lastJobAt ? ` · último ${formatDaysAgoPtBr(row.lastJobAt)}` : null}
                        </>
                      ) : (
                        <>
                          {row.jobsTotal} no total
                          {row.lastJobAt ? ` · último ${formatDaysAgoPtBr(row.lastJobAt)}` : null}
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <SemanticBadge tone={planTone(row.plan)}>{planLabel(row.plan)}</SemanticBadge>
                    <span className="tabular-nums text-base font-semibold text-ds-ink">
                      {value}
                    </span>
                  </div>
                </div>
                <div
                  className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ds-hairline"
                  aria-hidden
                >
                  <div
                    className="h-full rounded-full bg-ds-accent"
                    style={{ inlineSize: `${width}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
