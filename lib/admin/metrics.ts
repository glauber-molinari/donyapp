import type { SupabaseClient } from "@supabase/supabase-js";

import { formatBrlNumber } from "@/lib/admin/format";
import { PRO_PRICE_MONTHLY_CENTS, PRO_PRICE_YEARLY_CENTS } from "@/lib/plan-limits";
import type { Database } from "@/types/database";

export type AdminDashboardMetrics = {
  accountsTotal: number;
  accountsNew7d: number;
  accountsNew30d: number;
  usersTotal: number;
  avgUsersPerAccount: number;
  proActiveTotal: number;
  proPayingCount: number;
  proCompedCount: number;
  freeAccounts: number;
  mrrBrl: number;
  mrrNote: string;
  churnCanceled30d: number;
  churnRateApprox: number | null;
  pastDueCount: number;
  trialingCount: number;
  pendingInvitations: number;
  contactsTotal: number;
  jobsTotal: number;
  jobsCreated30d: number;
  accountsWithJobs30d: number;
  arpaPayingBrl: number | null;
  accountsActivated30d: number;
  activationRate30d: number | null;
};

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString();
}

export async function fetchAdminDashboardMetrics(
  db: SupabaseClient<Database>
): Promise<AdminDashboardMetrics> {
  const t30 = isoDaysAgo(30);
  const t7 = isoDaysAgo(7);

  const monthlyPrice = PRO_PRICE_MONTHLY_CENTS / 100;
  const yearlyMonthlyEquivalent = PRO_PRICE_YEARLY_CENTS / 100 / 12;

  const [
    accountsRes,
    accounts7Res,
    usersRes,
    proPayingRes,
    proCompedRes,
    proAllActiveRes,
    freePlanRes,
    churnRes,
    pastDueRes,
    trialingRes,
    invitesRes,
    contactsRes,
    jobsRes,
    jobs30Res,
    jobs30RowsRes,
  ] = await Promise.all([
    db.from("accounts").select("*", { count: "exact", head: true }),
    db.from("accounts").select("*", { count: "exact", head: true }).gte("created_at", t7),
    db.from("users").select("*", { count: "exact", head: true }).not("account_id", "is", null),
    db
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("plan", "pro")
      .eq("status", "active")
      .not("asaas_subscription_id", "is", null),
    db
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("plan", "pro")
      .eq("status", "active")
      .is("asaas_subscription_id", null),
    db.from("subscriptions").select("*", { count: "exact", head: true }).eq("plan", "pro").eq("status", "active"),
    db.from("subscriptions").select("*", { count: "exact", head: true }).eq("plan", "free"),
    db.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "canceled").gte("updated_at", t30),
    db.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "past_due"),
    db.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "trialing"),
    db
      .from("invitations")
      .select("*", { count: "exact", head: true })
      .is("accepted_at", null)
      .gt("expires_at", new Date().toISOString()),
    db.from("contacts").select("*", { count: "exact", head: true }),
    db.from("jobs").select("*", { count: "exact", head: true }),
    db.from("jobs").select("*", { count: "exact", head: true }).gte("created_at", t30),
    db.from("jobs").select("account_id").gte("created_at", t30).limit(50000),
  ]);

  const { data: newAccRows } = await db.from("accounts").select("id").gte("created_at", t30);

  const accountsTotal = accountsRes.count ?? 0;
  const usersTotal = usersRes.count ?? 0;
  const proPayingCount = proPayingRes.count ?? 0;
  const proCompedCount = proCompedRes.count ?? 0;
  const proActiveTotal = proAllActiveRes.count ?? 0;
  const churnCanceled30d = churnRes.count ?? 0;

  const mrrBrl = proPayingCount * monthlyPrice;
  const mrrNote =
    "MRR estimado = Pro pagantes (Asaas) × preço mensal listado. Quem assinou o plano anual paga em cobrança anual no cartão; o equivalente mensal aproximado seria " +
    `${formatBrlNumber(yearlyMonthlyEquivalent)} por conta anual. Para MRR exato por ciclo, seria necessário persistir mensal/anual no banco ou consultar o Asaas.`;

  const denom = proPayingCount + churnCanceled30d;
  const churnRateApprox = denom > 0 ? churnCanceled30d / denom : null;

  const accountIds30 = new Set((jobs30RowsRes.data ?? []).map((r) => r.account_id));

  const arpaPayingBrl = proPayingCount > 0 ? mrrBrl / proPayingCount : null;

  const newAccountIds30 = new Set((newAccRows ?? []).map((r) => r.id));
  let activated = 0;
  newAccountIds30.forEach((id) => {
    if (accountIds30.has(id)) activated += 1;
  });
  const accountsNew30d = newAccountIds30.size;
  const activationRate30d = accountsNew30d > 0 ? activated / accountsNew30d : null;

  return {
    accountsTotal,
    accountsNew7d: accounts7Res.count ?? 0,
    accountsNew30d,
    usersTotal,
    avgUsersPerAccount: accountsTotal > 0 ? usersTotal / accountsTotal : 0,
    proActiveTotal,
    proPayingCount,
    proCompedCount,
    freeAccounts: freePlanRes.count ?? 0,
    mrrBrl,
    mrrNote,
    churnCanceled30d,
    churnRateApprox,
    pastDueCount: pastDueRes.count ?? 0,
    trialingCount: trialingRes.count ?? 0,
    pendingInvitations: invitesRes.count ?? 0,
    contactsTotal: contactsRes.count ?? 0,
    jobsTotal: jobsRes.count ?? 0,
    jobsCreated30d: jobs30Res.count ?? 0,
    accountsWithJobs30d: accountIds30.size,
    arpaPayingBrl,
    accountsActivated30d: activated,
    activationRate30d,
  };
}
