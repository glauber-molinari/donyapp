import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { SettingsKanbanTabs } from "../settings-kanban-tabs";

export const metadata: Metadata = {
  title: "Kanban",
};

export default async function SettingsKanbanPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("account_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.account_id) {
    return (
      <div>
        <p className="text-sm text-ds-muted" role="alert">
          Conta não encontrada para este usuário.
        </p>
      </div>
    );
  }

  const [stagesRes, subRes, workTypesRes, usersCountRes, manualRes] = await Promise.all([
    supabase
      .from("kanban_stages")
      .select("*")
      .eq("account_id", profile.account_id)
      .order("position", { ascending: true }),
    supabase
      .from("subscriptions")
      .select("plan")
      .eq("account_id", profile.account_id)
      .maybeSingle(),
    supabase
      .from("job_work_types")
      .select("*")
      .eq("account_id", profile.account_id)
      .order("position", { ascending: true }),
    supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("account_id", profile.account_id),
    supabase
      .from("manual_job_assignees")
      .select("*")
      .eq("account_id", profile.account_id)
      .order("position", { ascending: true }),
  ]);

  if (stagesRes.error || workTypesRes.error || usersCountRes.error || manualRes.error) {
    return (
      <div>
        <p className="mt-2 text-sm text-red-600" role="alert">
          Não foi possível carregar o kanban.
        </p>
      </div>
    );
  }

  const plan = subRes.data?.plan ?? "free";
  const isAdmin = profile.role === "admin";
  const accountUserCount = usersCountRes.count ?? 0;

  return (
    <SettingsKanbanTabs
      stages={stagesRes.data ?? []}
      workTypes={workTypesRes.data ?? []}
      plan={plan}
      isAdmin={isAdmin}
      manualAssignees={manualRes.data ?? []}
      accountUserCount={accountUserCount}
    />
  );
}
