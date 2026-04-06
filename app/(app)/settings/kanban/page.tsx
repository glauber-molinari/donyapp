import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { SettingsKanbanSection } from "../settings-kanban-section";
import { SettingsWorkTypesSection } from "../settings-work-types-section";

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

  const [stagesRes, subRes, workTypesRes] = await Promise.all([
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
  ]);

  if (stagesRes.error || workTypesRes.error) {
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

  return (
    <div className="flex max-w-2xl flex-col gap-10">
      <SettingsKanbanSection stages={stagesRes.data ?? []} plan={plan} isAdmin={isAdmin} />
      <SettingsWorkTypesSection workTypes={workTypesRes.data ?? []} isAdmin={isAdmin} />
    </div>
  );
}
