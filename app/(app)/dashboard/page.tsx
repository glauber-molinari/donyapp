import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { fetchDashboardMetrics } from "@/lib/dashboard-metrics";
import { createClient } from "@/lib/supabase/server";

import { DashboardView, type JobWithRelations } from "./dashboard-view";

export const metadata: Metadata = {
  title: "Dashboard",
};

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
    .select("account_id")
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

  const [jobsRes, contactsRes, stagesRes, workTypesRes, metrics] = await Promise.all([
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
    fetchDashboardMetrics(supabase),
  ]);

  if (jobsRes.error || contactsRes.error || stagesRes.error || workTypesRes.error) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-ds-ink">Dashboard</h1>
        <p className="mt-2 text-sm text-red-600" role="alert">
          Não foi possível carregar os dados. Tente novamente.
        </p>
      </div>
    );
  }

  return (
    <DashboardView
      jobs={(jobsRes.data ?? []) as JobWithRelations[]}
      contacts={contactsRes.data ?? []}
      stages={stagesRes.data ?? []}
      workTypes={workTypesRes.data ?? []}
      metrics={metrics}
    />
  );
}
