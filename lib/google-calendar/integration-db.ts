import { createServiceRoleClient } from "@/lib/supabase/service-role";

export type AccountGoogleCalendarRow = {
  account_id: string;
  refresh_token: string;
  access_token: string | null;
  access_token_expires_at: string | null;
  google_email: string | null;
  calendar_id: string;
};

export async function getIntegrationByAccountId(
  accountId: string
): Promise<AccountGoogleCalendarRow | null> {
  const svc = createServiceRoleClient();
  if (!svc) return null;
  const { data, error } = await svc
    .from("account_google_calendar")
    .select(
      "account_id, refresh_token, access_token, access_token_expires_at, google_email, calendar_id"
    )
    .eq("account_id", accountId)
    .maybeSingle();
  if (error || !data) return null;
  return data as AccountGoogleCalendarRow;
}

export async function getIntegrationPublicMeta(accountId: string): Promise<{
  connected: boolean;
  googleEmail: string | null;
}> {
  const row = await getIntegrationByAccountId(accountId);
  if (!row) return { connected: false, googleEmail: null };
  return { connected: true, googleEmail: row.google_email };
}

export async function upsertIntegration(params: {
  accountId: string;
  refreshToken: string;
  accessToken: string | null;
  accessTokenExpiresAt: string | null;
  googleEmail: string | null;
  calendarId?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const svc = createServiceRoleClient();
  if (!svc) {
    return { ok: false, error: "Servidor sem service role (Supabase)." };
  }
  const { error } = await svc.from("account_google_calendar").upsert(
    {
      account_id: params.accountId,
      refresh_token: params.refreshToken,
      access_token: params.accessToken,
      access_token_expires_at: params.accessTokenExpiresAt,
      google_email: params.googleEmail,
      calendar_id: params.calendarId ?? "primary",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "account_id" }
  );
  if (error) {
    return { ok: false, error: "Não foi possível salvar a integração." };
  }
  return { ok: true };
}

export async function updateIntegrationTokens(params: {
  accountId: string;
  accessToken: string;
  accessTokenExpiresAt: string | null;
}): Promise<void> {
  const svc = createServiceRoleClient();
  if (!svc) return;
  await svc
    .from("account_google_calendar")
    .update({
      access_token: params.accessToken,
      access_token_expires_at: params.accessTokenExpiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq("account_id", params.accountId);
}

export async function deleteIntegration(accountId: string): Promise<{ ok: true } | { ok: false }> {
  const svc = createServiceRoleClient();
  if (!svc) return { ok: false };
  const { error } = await svc.from("account_google_calendar").delete().eq("account_id", accountId);
  if (error) return { ok: false };
  return { ok: true };
}
