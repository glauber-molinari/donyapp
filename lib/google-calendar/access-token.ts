import { assertGoogleOAuthEnv } from "@/lib/google-calendar/oauth-client";
import {
  getIntegrationByAccountId,
  updateIntegrationTokens,
  type AccountGoogleCalendarRow,
} from "@/lib/google-calendar/integration-db";

const REFRESH_MARGIN_MS = 120_000;

function expiryStillValid(row: AccountGoogleCalendarRow): boolean {
  if (!row.access_token || !row.access_token_expires_at) return false;
  const t = new Date(row.access_token_expires_at).getTime();
  return t > Date.now() + REFRESH_MARGIN_MS;
}

/** Garante access_token válido; persiste novo par quando renovar. */
export async function getValidGoogleCalendarAccessToken(
  row: AccountGoogleCalendarRow
): Promise<{ ok: true; accessToken: string } | { ok: false; error: string }> {
  if (expiryStillValid(row)) {
    return { ok: true, accessToken: row.access_token! };
  }

  let oauth2;
  try {
    oauth2 = assertGoogleOAuthEnv().oauth2;
  } catch {
    return { ok: false, error: "OAuth Google não configurado no servidor." };
  }

  oauth2.setCredentials({ refresh_token: row.refresh_token });

  try {
    const { credentials } = await oauth2.refreshAccessToken();
    const access = credentials.access_token;
    if (!access) {
      return { ok: false, error: "Não foi possível renovar o token de acesso." };
    }
    const expiresAt =
      credentials.expiry_date != null
        ? new Date(credentials.expiry_date).toISOString()
        : null;
    await updateIntegrationTokens({
      accountId: row.account_id,
      accessToken: access,
      accessTokenExpiresAt: expiresAt,
    });
    return { ok: true, accessToken: access };
  } catch {
    return { ok: false, error: "Falha ao renovar sessão com o Google. Reconecte a conta." };
  }
}

export async function getValidAccessTokenForAccount(
  accountId: string
): Promise<{ ok: true; accessToken: string; row: AccountGoogleCalendarRow } | { ok: false; error: string }> {
  const row = await getIntegrationByAccountId(accountId);
  if (!row) {
    return { ok: false, error: "Agenda não conectada." };
  }
  const tok = await getValidGoogleCalendarAccessToken(row);
  if (!tok.ok) return tok;
  return { ok: true, accessToken: tok.accessToken, row };
}
