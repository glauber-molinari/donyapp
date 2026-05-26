"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  Clock,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Activity,
  RefreshCw,
  Trophy,
  Target,
} from "lucide-react";
import clsx from "clsx";

import { fetchDeliveryMetrics, type DeliveryMetrics, type Period } from "./actions";

const PERIODS: { value: Period; label: string }[] = [
  { value: "month", label: "Este mês" },
  { value: "quarter", label: "3 meses" },
  { value: "year", label: "Este ano" },
  { value: "all", label: "Tudo" },
];

export function ReportsView() {
  const [period, setPeriod] = useState<Period>("all");
  const [metrics, setMetrics] = useState<DeliveryMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchDeliveryMetrics(period).then((result) => {
      if (cancelled) return;
      if (result.ok && result.data) {
        setMetrics(result.data);
        setError(null);
      } else {
        setError(result.error ?? "Erro ao carregar métricas");
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [period]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header + period filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ds-ink">Relatórios</h1>
          <p className="mt-1 text-sm text-ds-muted">
            Análise detalhada do desempenho das suas entregas
          </p>
        </div>
        <div className="flex self-start rounded-ds-lg border border-ds-border bg-ds-elevated p-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={clsx(
                "rounded-ds-md px-3 py-1.5 text-xs font-medium transition-all duration-[120ms]",
                period === p.value
                  ? "bg-ds-surface text-ds-ink shadow-ds-sm"
                  : "text-ds-muted hover:text-ds-ink-2",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading && <LoadingSkeleton />}

      {!loading && error && (
        <p className="text-sm text-ds-danger" role="alert">
          {error}
        </p>
      )}

      {!loading && metrics && (
        <>
          {/* Section: Entregas */}
          <section className="flex flex-col gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-ds-muted-2">
              Entregas
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                title="Média de entrega"
                value={`${metrics.averageDaysToDeliver}d`}
                icon={Clock}
                description="Tempo médio por job entregue"
                tone="info"
              />
              <MetricCard
                title="Total entregue"
                value={String(metrics.totalDelivered)}
                icon={CheckCircle2}
                description="Jobs finalizados no período"
                tone="success"
              />
              <MetricCard
                title="Jobs ativos"
                value={String(metrics.currentActiveJobs)}
                icon={Activity}
                description="Em andamento agora"
                tone="warn"
              />
              <MetricCard
                title="Alterações / job"
                value={String(metrics.averageRevisions)}
                icon={RefreshCw}
                description="Média de revisões do cliente"
                tone="neutral"
              />
            </div>
          </section>

          {/* Section: Tarefas */}
          <section className="flex flex-col gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-ds-muted-2">
              Tarefas
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                title="Concluídas"
                value={String(metrics.tasksSummary.done)}
                icon={CheckCircle2}
                description="No período selecionado"
                tone="success"
              />
              <MetricCard
                title="Em aberto"
                value={String(metrics.tasksSummary.open)}
                icon={Activity}
                description="Para fazer ou iniciado"
                tone="warn"
              />
              <MetricCard
                title="Média de conclusão"
                value={`${metrics.tasksSummary.averageDaysToComplete}d`}
                icon={Clock}
                description="Dias até marcar como feito"
                tone="info"
              />
              <MetricCard
                title="No prazo"
                value={`${metrics.tasksSummary.percentDoneOnTime}%`}
                icon={Target}
                description="Das tarefas concluídas"
                tone={metrics.tasksSummary.percentDoneOnTime >= 70 ? "success" : "danger"}
              />
            </div>
          </section>

          {/* Entregas por Mês — gráfico de barras */}
          {metrics.deliveriesByMonth.length > 0 && (
            <Panel title="Entregas por Mês" icon={BarChart3}>
              <MonthBarChart data={metrics.deliveriesByMonth} />
            </Panel>
          )}

          {/* Média por Tipo + Entregas no Prazo */}
          <div className="grid gap-4 md:grid-cols-2">
            <Panel title="Média por Tipo de Job" icon={BarChart3}>
              <TypeBars averages={metrics.averageDaysByType} />
            </Panel>
            <Panel title="Entregas no Prazo" icon={Target}>
              <OnTimeSummary
                onTime={metrics.deliveredOnTime}
                late={metrics.deliveredLate}
                pctOnTime={metrics.percentOnTime}
                pctLate={metrics.percentLate}
                total={metrics.totalDelivered}
              />
            </Panel>
          </div>

          {/* Desempenho por tipo de trabalho */}
          {metrics.deliveriesByWorkType.length > 0 && (
            <Panel title="Desempenho por Tipo de Trabalho" icon={TrendingUp}>
              <WorkTypeBars data={metrics.deliveriesByWorkType} />
            </Panel>
          )}

          {/* Top responsáveis */}
          <TopPerformers performers={metrics.topPerformers} />
        </>
      )}
    </div>
  );
}

// ─── Metric Card ──────────────────────────────────────────────────────────────

type Tone = "neutral" | "success" | "danger" | "warn" | "info";

const TONES: Record<Tone, { bg: string; icon: string; value: string }> = {
  neutral: { bg: "bg-ds-elevated", icon: "text-ds-muted", value: "text-ds-ink" },
  success: { bg: "bg-ds-success-soft", icon: "text-ds-success", value: "text-ds-ink" },
  danger: { bg: "bg-ds-danger-soft", icon: "text-ds-danger", value: "text-ds-danger" },
  warn: { bg: "bg-ds-warn-soft", icon: "text-ds-warn", value: "text-ds-ink" },
  info: { bg: "bg-ds-info-soft", icon: "text-ds-info", value: "text-ds-info" },
};

function MetricCard({
  title,
  value,
  icon: Icon,
  description,
  tone = "neutral",
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  description: string;
  tone?: Tone;
}) {
  const t = TONES[tone];
  return (
    <div className="rounded-ds-card border border-ds-border bg-ds-surface p-5 shadow-ds-sm">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-ds-muted-2">
          {title}
        </span>
        <div className={clsx("rounded-ds-md p-1.5", t.bg)}>
          <Icon className={clsx("h-4 w-4", t.icon)} />
        </div>
      </div>
      <p className={clsx("text-3xl font-bold", t.value)}>{value}</p>
      <p className="mt-1 text-xs text-ds-muted">{description}</p>
    </div>
  );
}

// ─── Panel wrapper ────────────────────────────────────────────────────────────

function Panel({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-ds-card border border-ds-border bg-ds-surface p-5 shadow-ds-sm">
      <div className="mb-5 flex items-center gap-2">
        <Icon className="h-4 w-4 text-ds-muted" />
        <h2 className="text-sm font-semibold text-ds-ink">{title}</h2>
      </div>
      {children}
    </div>
  );
}

// ─── Gráfico de barras — Entregas por Mês ────────────────────────────────────

function MonthBarChart({ data }: { data: DeliveryMetrics["deliveriesByMonth"] }) {
  const ordered = [...data].reverse();
  const max = Math.max(...data.map((m) => m.total), 1);

  return (
    <div className="space-y-2">
      {/* Legend */}
      <div className="mb-4 flex items-center gap-5 text-xs text-ds-muted">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-ds-success" />
          No prazo
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-ds-danger" />
          Atrasado
        </span>
      </div>

      {ordered.map((m, i) => (
        <div key={i} className="flex items-center gap-3 text-xs">
          <span className="w-16 shrink-0 text-right text-ds-muted">{m.month}</span>
          <div className="relative flex h-7 flex-1 overflow-hidden rounded-ds-sm bg-ds-hairline">
            <div
              className="h-full bg-ds-success transition-[width] duration-300"
              style={{ inlineSize: `${(m.onTime / max) * 100}%` }}
            />
            <div
              className="h-full bg-ds-danger transition-[width] duration-300"
              style={{ inlineSize: `${(m.late / max) * 100}%` }}
            />
          </div>
          <div className="flex w-24 shrink-0 items-center justify-end gap-2 text-right">
            {m.onTime > 0 && (
              <span className="text-ds-success">
                {m.onTime}✓
              </span>
            )}
            {m.late > 0 && (
              <span className="text-ds-danger">
                {m.late}✗
              </span>
            )}
            <span className="font-semibold text-ds-ink">{m.total}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Barras horizontais — Média por Tipo ─────────────────────────────────────

function TypeBars({ averages }: { averages: DeliveryMetrics["averageDaysByType"] }) {
  const types = [
    { label: "Foto", days: averages.foto },
    { label: "Vídeo", days: averages.video },
    { label: "Foto + Vídeo", days: averages.foto_video },
  ].filter((t) => t.days > 0);

  if (types.length === 0) {
    return (
      <p className="text-sm text-ds-muted">Sem entregas registradas no período.</p>
    );
  }

  const max = Math.max(...types.map((t) => t.days));

  return (
    <div className="space-y-5">
      {types.map((t) => (
        <div key={t.label} className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-ds-ink">{t.label}</span>
            <span className="text-sm font-semibold text-ds-info">{t.days} dias</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-ds-pill bg-ds-hairline">
            <div
              className="h-full bg-ds-info transition-[width] duration-300"
              style={{ inlineSize: `${(t.days / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Entregas no Prazo ────────────────────────────────────────────────────────

function OnTimeSummary({
  onTime,
  late,
  pctOnTime,
  pctLate,
  total,
}: {
  onTime: number;
  late: number;
  pctOnTime: number;
  pctLate: number;
  total: number;
}) {
  if (total === 0) {
    return <p className="text-sm text-ds-muted">Sem entregas no período.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-ds-xl bg-ds-success-soft p-4">
          <div className="mb-1 flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-ds-success" />
            <span className="text-xs text-ds-muted">No prazo</span>
          </div>
          <p className="text-2xl font-bold text-ds-success">{pctOnTime}%</p>
          <p className="mt-0.5 text-xs text-ds-muted">
            {onTime} {onTime === 1 ? "job" : "jobs"}
          </p>
        </div>
        <div className="rounded-ds-xl bg-ds-danger-soft p-4">
          <div className="mb-1 flex items-center gap-1.5">
            <XCircle className="h-3.5 w-3.5 text-ds-danger" />
            <span className="text-xs text-ds-muted">Atrasado</span>
          </div>
          <p className="text-2xl font-bold text-ds-danger">{pctLate}%</p>
          <p className="mt-0.5 text-xs text-ds-muted">
            {late} {late === 1 ? "job" : "jobs"}
          </p>
        </div>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-ds-pill bg-ds-hairline">
        <div
          className="h-full bg-ds-success transition-[width] duration-300"
          style={{ inlineSize: `${pctOnTime}%` }}
        />
      </div>
      <p className="text-xs text-ds-muted">{total} {total === 1 ? "entrega" : "entregas"} no período</p>
    </div>
  );
}

// ─── Desempenho por Tipo de Trabalho ─────────────────────────────────────────

function WorkTypeBars({ data }: { data: DeliveryMetrics["deliveriesByWorkType"] }) {
  const maxTotal = Math.max(...data.map((d) => d.total), 1);

  return (
    <div className="space-y-4">
      {data.map((wt, i) => (
        <div key={i} className="flex items-center gap-4">
          <span className="w-28 shrink-0 text-sm font-medium text-ds-ink">{wt.workTypeName}</span>
          <div className="flex flex-1 items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-ds-pill bg-ds-hairline">
              <div
                className="h-full bg-ds-info transition-[width] duration-300"
                style={{ inlineSize: `${(wt.total / maxTotal) * 100}%` }}
              />
            </div>
            <span className="w-16 shrink-0 text-right text-xs text-ds-muted">
              {wt.total} {wt.total === 1 ? "entrega" : "entregas"}
            </span>
          </div>
          <span className="w-12 shrink-0 text-right text-sm font-semibold text-ds-info">
            {wt.averageDays}d
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Top responsáveis ─────────────────────────────────────────────────────────

function TopPerformers({ performers }: { performers: DeliveryMetrics["topPerformers"] }) {
  return (
    <div className="rounded-ds-card border border-ds-border bg-ds-surface p-5 shadow-ds-sm">
      <div className="mb-5 flex items-center gap-2">
        <Trophy className="h-4 w-4 text-ds-muted" />
        <h2 className="text-sm font-semibold text-ds-ink">Top responsáveis (mais rápidos)</h2>
      </div>

      {performers.length === 0 ? (
        <div className="rounded-ds-xl bg-ds-cream p-4 text-sm text-ds-muted">
          Finalize um{" "}
          <span className="font-medium text-ds-ink">job</span> ou marque tarefas como{" "}
          <span className="font-medium text-ds-ink">feito</span> para ver o ranking aqui.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ds-hairline text-left">
                  <th className="pb-2.5 text-[11px] font-semibold uppercase tracking-wide text-ds-muted-2">
                    Responsável
                  </th>
                  <th className="pb-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-ds-muted-2">
                    Entregas
                  </th>
                  <th className="pb-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-ds-muted-2">
                    Tarefas
                  </th>
                  <th className="pb-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-ds-muted-2">
                    Média
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ds-hairline">
                {performers.map((p, idx) => (
                  <tr key={`${p.id}-${idx}`}>
                    <td className="py-3">
                      <div className="flex items-center gap-2.5">
                        {p.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.avatarUrl}
                            alt=""
                            className="h-7 w-7 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-ds-elevated text-[11px] font-semibold text-ds-muted">
                            {(p.name || "?")[0].toUpperCase()}
                          </div>
                        )}
                        <span className="font-medium text-ds-ink">{p.name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-center text-ds-muted">{p.deliveries}</td>
                    <td className="py-3 text-center text-ds-muted">{p.tasksDone}</td>
                    <td className="py-3 text-right font-semibold text-ds-info">{p.averageDays}d</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-ds-muted">
            Média calculada por itens concluídos (entregas + tarefas). Se um job tiver foto e
            vídeo com responsáveis diferentes, conta para ambos.
          </p>
        </>
      )}
    </div>
  );
}

// ─── Skeleton de carregamento ─────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-ds-card bg-ds-elevated-soft" />
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-ds-card bg-ds-elevated-soft" />
        ))}
      </div>
      <div className="h-52 rounded-ds-card bg-ds-elevated-soft" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-40 rounded-ds-card bg-ds-elevated-soft" />
        <div className="h-40 rounded-ds-card bg-ds-elevated-soft" />
      </div>
      <div className="h-48 rounded-ds-card bg-ds-elevated-soft" />
    </div>
  );
}
