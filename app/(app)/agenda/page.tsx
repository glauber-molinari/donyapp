import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getIntegrationPublicMeta } from "@/lib/google-calendar/integration-db";
import { createClient } from "@/lib/supabase/server";

import { AgendaView } from "./agenda-view";

export const metadata: Metadata = {
  title: "Agenda",
};

export default async function AgendaPage() {
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
        <h1 className="text-2xl font-bold text-ds-ink">Agenda</h1>
        <p className="mt-2 text-sm text-ds-muted" role="alert">
          Conta não encontrada para este usuário.
        </p>
      </div>
    );
  }

  const meta = await getIntegrationPublicMeta(profile.account_id);

  return (
    <AgendaView
      connected={meta.connected}
      googleEmail={meta.googleEmail}
      isAdmin={profile.role === "admin"}
    />
  );
}
