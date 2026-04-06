import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { SettingsTeamSection } from "../settings-team-section";

export const metadata: Metadata = {
  title: "Equipe",
};

export default async function SettingsTeamPage() {
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

  const [teamRes, subRes] = await Promise.all([
    supabase
      .from("users")
      .select("id, name, email, role, created_at")
      .eq("account_id", profile.account_id)
      .order("created_at", { ascending: true }),
    supabase
      .from("subscriptions")
      .select("plan")
      .eq("account_id", profile.account_id)
      .maybeSingle(),
  ]);

  if (teamRes.error) {
    return (
      <div>
        <p className="mt-2 text-sm text-red-600" role="alert">
          Não foi possível carregar a equipe.
        </p>
      </div>
    );
  }

  const plan = subRes.data?.plan ?? "free";
  const isAdmin = profile.role === "admin";

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <SettingsTeamSection
        members={teamRes.data ?? []}
        plan={plan}
        isAdmin={isAdmin}
        currentUserId={user.id}
      />
    </div>
  );
}
