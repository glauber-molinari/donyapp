import { AdminAdoptionList } from "@/components/admin/admin-adoption-list";
import { AdminJobMix } from "@/components/admin/admin-job-mix";
import { AdminMetricCard } from "@/components/admin/admin-metric-card";
import { AdminUsageLeaderboard } from "@/components/admin/admin-usage-leaderboard";
import { formatBrlNumber, formatPercentRatio } from "@/lib/admin/format";
import { fetchAdminDashboardMetrics } from "@/lib/admin/metrics";
import { fetchAdminUsageSnapshot } from "@/lib/admin/usage";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

  const [m, u] = await Promise.all([
    fetchAdminDashboardMetrics(svc),
    fetchAdminUsageSnapshot(svc),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-xl font-semibold text-ds-ink">Dashboard</h2>
        <p className="mt-1 text-sm text-ds-muted">
          Receita e contas primeiro. Depois, o que o pessoal está fazendo no app — sem e-mail,
          cliente ou título de job.
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
            hint="Contas que cadastraram job no período"
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
        <h3 className="mb-3 text-sm font-semibold text-ds-ink">Uso no dia a dia</h3>
        <p className="mb-3 text-sm text-ds-muted">
          Só volume. Nenhum nome de cliente, e-mail, telefone, título de job ou resposta de
          formulário.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <AdminMetricCard
            label="Jobs totais"
            value={intPt(u.jobsTotal)}
            hint={`${intPt(u.jobsInProgress)} em aberto · ${intPt(u.jobsFinished)} na coluna final`}
          />
          <AdminMetricCard
            label="Jobs criados (7 dias)"
            value={intPt(u.jobsCreated7d)}
            hint="Cadastros novos no Kanban"
          />
          <AdminMetricCard
            label="Jobs criados (30 dias)"
            value={intPt(u.jobsCreated30d)}
            hint={`${intPt(u.jobsTouched30d)} jobs tiveram alguma alteração no mesmo período`}
          />
          <AdminMetricCard
            label="Média de jobs / conta"
            value={decPt(u.avgJobsPerActiveAccount, 1)}
            hint="Só entre quem já cadastrou pelo menos um job"
          />
          <AdminMetricCard
            label="Nunca criaram job"
            value={intPt(u.accountsNeverJob)}
            hint="Contas com usuário que pararam no cadastro"
          />
          <AdminMetricCard
            label="Parados (30 dias)"
            value={intPt(u.dormant30d)}
            hint="Têm usuário, mas não criaram nem mexeram em job no mês"
          />
          <AdminMetricCard
            label="Contas ativas (7 dias)"
            value={intPt(u.active7d)}
            hint="Mexeram em job, criaram tarefa/galeria ou receberam formulário"
          />
          <AdminMetricCard
            label="Voltaram na semana"
            value={u.stickiness != null ? formatPercentRatio(u.stickiness) : "—"}
            hint="Contas ativas nos últimos 7 dias, entre as ativas nos últimos 30. Mais alto = uso mais constante."
          />
          <AdminMetricCard label="Contatos" value={intPt(u.contactsTotal)} />
          <AdminMetricCard
            label="Tarefas"
            value={intPt(u.tasksTotal)}
            hint={`${intPt(u.tasksDone)} feitas · ${intPt(u.tasksCreated30d)} nos últimos 30 dias`}
          />
          <AdminMetricCard
            label="Formulários"
            value={intPt(u.formsActive)}
            hint={`${intPt(u.formSubmissions)} respostas · ${intPt(u.formSubmissions30d)} no mês`}
          />
          <AdminMetricCard
            label="Convites pendentes"
            value={intPt(u.pendingInvitations)}
            hint="Ainda não aceitos e não expirados"
          />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminUsageLeaderboard
          title="Top 5 por jobs"
          description="Estúdios com mais jobs no Kanban. A barra é o total; o texto abaixo mostra se isso é uso recente."
          rows={u.topByJobs}
          sortKey="jobsTotal"
          empty="Ainda não há jobs cadastrados."
        />
        <AdminUsageLeaderboard
          title="Top 5 no último mês"
          description="Quem mais mexeu em job nos últimos 30 dias: cadastro novo, etapa ou prazo. Acúmulo antigo não entra."
          rows={u.topByJobs30d}
          sortKey="jobsTouched30d"
          empty="Ninguém mexeu em job nos últimos 30 dias."
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminJobMix
          byType={u.jobsByType}
          inProgress={u.jobsInProgress}
          finished={u.jobsFinished}
          withContact={u.jobsWithContact}
          albumBoard={u.jobsAlbumBoard}
          editBoard={u.jobsEditBoard}
          total={u.jobsTotal}
        />
        <AdminAdoptionList rows={u.adoption} total={u.accountsWithMembers} />
      </div>

      <p className="text-xs leading-relaxed text-ds-muted">
        O ranking usa o nome do estúdio da conta, não a pessoa da equipe. Jobs pertencem à
        conta. Para evoluir: eventos de produto (MAU/WAU real), NRR, CAC e cohort de receita
        exigem instrumentação ou exportação (ex.: Stripe/Asaas + armazenamento de eventos). O
        MRR aqui assume preço mensal para cada assinatura vinculada ao Asaas.
      </p>
    </div>
  );
}
