import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { fetchDashboardMetrics } from "@/lib/dashboard-metrics";
import { getIntegrationPublicMeta } from "@/lib/google-calendar/integration-db";
import { createClient } from "@/lib/supabase/server";
import type { Plan } from "@/types/database";

import { DashboardView, type JobWithRelations } from "./dashboard-view";

export const metadata: Metadata = {
  title: "Dashboard",
};

function DashboardLoadingFallback() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-ds-ink">Dashboard</h1>
      <p className="text-sm text-ds-muted">Carregando…</p>
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("account_id, name, email, avatar_url, tour_completed")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.account_id) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-ds-ink">Dashboard</h1>
        <p className="mt-2 text-sm text-ds-muted" role="alert">
          Conta não encontrada para este usuário.
        </p>
      </div>
    );
  }

  const [jobsRes, contactsRes, stagesRes, workTypesRes, membersRes, metrics, subRes, agendaMeta] =
    await Promise.all([
    supabase
      .from("jobs")
      .select(
        `
        *,
        contacts ( id, name, email ),
        kanban_stages ( id, name, position, is_final ),
        job_work_types ( id, name )
      `
      )
      .order("deadline", { ascending: true }),
    supabase.from("contacts").select("id, name, email").order("name", { ascending: true }),
    supabase
      .from("kanban_stages")
      .select("id, name, position")
      .order("position", { ascending: true }),
    supabase
      .from("job_work_types")
      .select("*")
      .eq("account_id", profile.account_id)
      .order("position", { ascending: true }),
    supabase
      .from("users")
      .select("id, name, email, avatar_url")
      .eq("account_id", profile.account_id)
      .order("created_at", { ascending: true }),
    fetchDashboardMetrics(supabase),
    supabase
      .from("subscriptions")
      .select("plan")
      .eq("account_id", profile.account_id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    getIntegrationPublicMeta(profile.account_id),
  ]);

  if (
    jobsRes.error ||
    contactsRes.error ||
    stagesRes.error ||
    workTypesRes.error ||
    membersRes.error ||
    subRes.error
  ) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-ds-ink">Dashboard</h1>
        <p className="mt-2 text-sm text-red-600" role="alert">
          Não foi possível carregar os dados. Tente novamente.
        </p>
      </div>
    );
  }

  const plan: Plan = subRes.data?.plan ?? "free";

  return (
    <Suspense fallback={<DashboardLoadingFallback />}>
      <DashboardView
        members={(membersRes.data ?? []).map((m) => ({
          id: m.id,
          name: m.name ?? m.email ?? "Usuário",
          email: m.email ?? null,
          avatarUrl: m.avatar_url ?? null,
        }))}
        jobs={(jobsRes.data ?? []) as JobWithRelations[]}
        contacts={contactsRes.data ?? []}
        stages={stagesRes.data ?? []}
        workTypes={workTypesRes.data ?? []}
        metrics={metrics}
        agendaConnected={agendaMeta.connected}
        tourCompleted={profile.tour_completed === true}
        plan={plan}
      />
    </Suspense>
  );
}
