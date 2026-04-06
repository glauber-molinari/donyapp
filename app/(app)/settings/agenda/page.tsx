import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { googleCalendarOAuthRedirectUri } from "@/lib/app-url";
import { getIntegrationPublicMeta } from "@/lib/google-calendar/integration-db";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { createClient } from "@/lib/supabase/server";

import { SettingsAgendaSection } from "../settings-agenda-section";

export const metadata: Metadata = {
  title: "Agenda",
};

export default async function SettingsAgendaPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
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

  const integrationServerReady = createServiceRoleClient() != null;
  const meta = await getIntegrationPublicMeta(profile.account_id);
  const oauthCallbackPreview =
    googleCalendarOAuthRedirectUri() || "(defina NEXT_PUBLIC_APP_URL no .env)";

  const isAdmin = profile.role === "admin";

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-ds-ink">Google Calendar</h2>
        <p className="mt-1 text-sm text-ds-muted">
          Somente administradores conectam ou trocam a conta Google. Todos os usuários da conta podem ver
          os eventos na página Agenda.
        </p>
      </div>
      <SettingsAgendaSection
        isAdmin={isAdmin}
        connected={meta.connected}
        googleEmail={meta.googleEmail}
        integrationServerReady={integrationServerReady}
        oauthCallbackPreview={oauthCallbackPreview}
        searchParams={searchParams}
      />
    </div>
  );
}
