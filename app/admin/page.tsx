import { AdminMetricCard } from "@/components/admin/admin-metric-card";
import { formatBrlNumber, formatPercentRatio } from "@/lib/admin/format";
import { fetchAdminDashboardMetrics } from "@/lib/admin/metrics";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

function intPt(n: number): string {
  return Math.round(n).toLocaleString("pt-BR");
}

function decPt(n: number, digits = 1): string {
  return n.toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export default async function AdminDashboardPage() {
  const svc = createServiceRoleClient();
  if (!svc) {
    return (
      <div className="rounded-ds-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        Configure <code className="rounded bg-white/60 px-1">SUPABASE_SERVICE_ROLE_KEY</code> para
        carregar métricas agregadas.
      </div>
    );
  }

  const m = await fetchAdminDashboardMetrics(svc);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-xl font-semibold text-ds-ink">Dashboard</h2>
        <p className="mt-1 text-sm text-ds-muted">
          Indicadores operacionais e de receita recorrente estimada. Dados em tempo real do
          Supabase (sem histórico financeiro completo).
        </p>
      </div>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-ds-ink">Contas e usuários</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <AdminMetricCard
            label="Contas (estúdios)"
            value={intPt(m.accountsTotal)}
            hint="E-mails únicos de admins com conta ativa. Deduplica contas de teste do mesmo e-mail."
          />
          <AdminMetricCard
            label="Contas ativas"
            value={intPt(m.accountsWithMembers)}
            hint="Studios com ao menos 1 usuário provisionado em public.users"
          />
          <AdminMetricCard
            label="Novas contas (7 dias)"
            value={intPt(m.accountsNew7d)}
            hint="Registros na tabela accounts nos últimos 7 dias (inclui duplicatas)"
          />
          <AdminMetricCard
            label="Novas contas (30 dias)"
            value={intPt(m.accountsNew30d)}
            hint="Registros na tabela accounts nos últimos 30 dias (inclui duplicatas)"
          />
          <AdminMetricCard
            label="Usuários (auth)"
            value={intPt(m.usersTotal)}
            hint="Logins cadastrados em auth.users (fonte: Supabase Auth)"
          />
          <AdminMetricCard
            label="Média de usuários / conta"
            value={decPt(m.avgUsersPerAccount, 2)}
          />
          <AdminMetricCard
            label="Ativação (30 dias)"
            value={m.activationRate30d != null ? formatPercentRatio(m.activationRate30d) : "—"}
            hint="Contas novas nos últimos 30 dias que criaram ao menos um job no mesmo período"
          />
          <AdminMetricCard
            label="Contas com job (30 dias)"
            value={intPt(m.accountsWithJobs30d)}
            hint="Engajamento no Kanban"
          />
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-ds-ink">Receita e assinaturas</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <AdminMetricCard
            label="MRR estimado"
            value={formatBrlNumber(m.mrrBrl)}
            hint={m.mrrNote}
          />
          <AdminMetricCard
            label="Pro ativo (total)"
            value={intPt(m.proActiveTotal)}
            hint="Inclui pagantes e cortesia"
          />
          <AdminMetricCard label="Pro pagantes (Asaas)" value={intPt(m.proPayingCount)} />
          <AdminMetricCard label="Pro cortesia (sem Asaas)" value={intPt(m.proCompedCount)} />
          <AdminMetricCard
            label="Contas Free"
            value={intPt(m.freeAccounts)}
            hint="Plano free no registro de assinatura"
          />
          <AdminMetricCard
            label="ARPA (pagantes)"
            value={m.arpaPayingBrl != null ? formatBrlNumber(m.arpaPayingBrl) : "—"}
            hint="MRR ÷ Pro pagantes"
          />
          <AdminMetricCard label="Em atraso (past_due)" value={intPt(m.pastDueCount)} />
          <AdminMetricCard label="Em trial" value={intPt(m.trialingCount)} />
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-ds-ink">Churn e retenção (proxy)</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <AdminMetricCard
            label="Cancelados (30 dias)"
            value={intPt(m.churnCanceled30d)}
            hint="Assinaturas com status cancelado atualizadas nos últimos 30 dias"
          />
          <AdminMetricCard
            label="Logo churn aprox. (30 dias)"
            value={m.churnRateApprox != null ? formatPercentRatio(m.churnRateApprox) : "—"}
            hint="Cancelados 30d ÷ (Pro pagantes + cancelados 30d). Aproximação sem coorte histórica."
          />
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-ds-ink">Produto e convites</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <AdminMetricCard label="Contatos totais" value={intPt(m.contactsTotal)} />
          <AdminMetricCard label="Jobs totais" value={intPt(m.jobsTotal)} />
          <AdminMetricCard
            label="Jobs criados (30 dias)"
            value={intPt(m.jobsCreated30d)}
            hint="Volume recente no funil"
          />
          <AdminMetricCard
            label="Convites pendentes"
            value={intPt(m.pendingInvitations)}
            hint="Ainda não aceitos e não expirados"
          />
        </div>
      </section>

      <p className="text-xs leading-relaxed text-ds-muted">
        Para evoluir: eventos de produto (MAU/WAU), NRR, CAC e cohort de receita exigem
        instrumentação ou exportação (ex.: Stripe/Asaas + armazenamento de eventos). O MRR aqui
        assume preço mensal para cada assinatura vinculada ao Asaas.
      </p>
    </div>
  );
}
