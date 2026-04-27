"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  Calendar,
  Clock,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Activity,
  RefreshCw,
} from "lucide-react";

import { fetchDeliveryMetrics, type DeliveryMetrics } from "./actions";

export function ReportsView() {
  const [metrics, setMetrics] = useState<DeliveryMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMetrics() {
      setLoading(true);
      const result = await fetchDeliveryMetrics();
      if (result.ok && result.data) {
        setMetrics(result.data);
      } else {
        setError(result.error ?? "Erro ao carregar métricas");
      }
      setLoading(false);
    }

    loadMetrics();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-ds-ink">Relatórios</h1>
        <p className="text-sm text-ds-muted">Carregando métricas...</p>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-ds-ink">Relatórios</h1>
        <p className="text-sm text-red-600" role="alert">
          {error ?? "Erro ao carregar métricas"}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-ds-ink">Relatórios de Entrega</h1>
        <p className="mt-1 text-sm text-ds-muted">
          Análise detalhada do desempenho das suas entregas
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Média de Entrega"
          value={`${metrics.averageDaysToDeliver} dias`}
          icon={Clock}
          description="Tempo médio para concluir uma entrega"
          color="blue"
        />
        <MetricCard
          title="Total Entregue"
          value={metrics.totalDelivered.toString()}
          icon={CheckCircle2}
          description="Jobs finalizados"
          color="green"
        />
        <MetricCard
          title="Jobs Ativos"
          value={metrics.currentActiveJobs.toString()}
          icon={Activity}
          description="Em andamento"
          color="orange"
        />
        <MetricCard
          title="Média de Alterações"
          value={metrics.averageRevisions.toString()}
          icon={RefreshCw}
          description="Por job"
          color="purple"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-app-border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-ds-accent" />
            <h2 className="text-lg font-semibold text-ds-ink">Média por Tipo de Job</h2>
          </div>
          <div className="space-y-3">
            <TypeMetric label="Foto" days={metrics.averageDaysByType.foto} />
            <TypeMetric label="Vídeo" days={metrics.averageDaysByType.video} />
            <TypeMetric label="Foto + Vídeo" days={metrics.averageDaysByType.foto_video} />
          </div>
        </div>

        <div className="rounded-lg border border-app-border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-ds-accent" />
            <h2 className="text-lg font-semibold text-ds-ink">Entregas no Prazo</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-ds-ink">No prazo</span>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">{metrics.percentOnTime}%</p>
                <p className="text-xs text-ds-muted">{metrics.deliveredOnTime} jobs</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <span className="text-sm font-medium text-ds-ink">Atrasado</span>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-red-600">{metrics.percentLate}%</p>
                <p className="text-xs text-ds-muted">{metrics.deliveredLate} jobs</p>
              </div>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full bg-green-600 transition-all"
                style={{ width: `${metrics.percentOnTime}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {metrics.deliveriesByWorkType.length > 0 && (
        <div className="rounded-lg border border-app-border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-ds-accent" />
            <h2 className="text-lg font-semibold text-ds-ink">Desempenho por Tipo de Trabalho</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-app-border text-left text-sm font-medium text-ds-muted">
                  <th className="pb-2">Tipo de Trabalho</th>
                  <th className="pb-2 text-center">Total Entregue</th>
                  <th className="pb-2 text-right">Média de Dias</th>
                </tr>
              </thead>
              <tbody>
                {metrics.deliveriesByWorkType.map((wt, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-app-border/50 text-sm last:border-0"
                  >
                    <td className="py-3 font-medium text-ds-ink">{wt.workTypeName}</td>
                    <td className="py-3 text-center text-ds-muted">{wt.total}</td>
                    <td className="py-3 text-right font-semibold text-ds-accent">
                      {wt.averageDays} dias
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {metrics.deliveriesByMonth.length > 0 && (
        <div className="rounded-lg border border-app-border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-ds-accent" />
            <h2 className="text-lg font-semibold text-ds-ink">Entregas por Mês</h2>
          </div>
          <div className="space-y-3">
            {metrics.deliveriesByMonth.map((m, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
              >
                <span className="text-sm font-medium text-ds-ink">{m.month}</span>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-ds-muted">Total: {m.total}</span>
                  <span className="text-green-600">No prazo: {m.onTime}</span>
                  <span className="text-red-600">Atrasado: {m.late}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  description: string;
  color: "blue" | "green" | "orange" | "purple";
}

function MetricCard({ title, value, icon: Icon, description, color }: MetricCardProps) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    orange: "bg-orange-50 text-orange-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <div className="rounded-lg border border-app-border bg-white p-6 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-ds-muted">{title}</span>
        <div className={`rounded-lg p-2 ${colorClasses[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="text-3xl font-bold text-ds-ink">{value}</p>
      <p className="mt-1 text-xs text-ds-muted">{description}</p>
    </div>
  );
}

interface TypeMetricProps {
  label: string;
  days: number;
}

function TypeMetric({ label, days }: TypeMetricProps) {
  if (days === 0) return null;

  return (
    <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
      <span className="text-sm font-medium text-ds-ink">{label}</span>
      <span className="text-lg font-bold text-ds-accent">{days} dias</span>
    </div>
  );
}
