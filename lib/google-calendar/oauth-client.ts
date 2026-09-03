import { google } from "googleapis";

import { googleCalendarOAuthRedirectUri } from "@/lib/app-url";

/**
 * Escopos mínimos da Agenda:
 * - events.owned.readonly: listar eventos do calendário primary (somente leitura)
 * - openid + userinfo.email: identificar qual Conta Google o admin conectou
 *
 * Não pedimos calendar.calendarlist.readonly: usamos o ID fixo "primary" e
 * colors.get (autorizado por events.owned.readonly) para a paleta de eventos.
 */
export const GOOGLE_CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events.owned.readonly",
  "openid",
  "https://www.googleapis.com/auth/userinfo.email",
] as const;

export type GoogleOAuth2Client = InstanceType<typeof google.auth.OAuth2>;

export function createGoogleOAuth2Client(): GoogleOAuth2Client | null {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const redirectUri = googleCalendarOAuthRedirectUri();

  if (!clientId || !clientSecret || !redirectUri) {
    return null;
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function assertGoogleOAuthEnv(): { oauth2: GoogleOAuth2Client } {
  const oauth2 = createGoogleOAuth2Client();
  if (!oauth2) {
    throw new Error(
      "Google OAuth: defina GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET e NEXT_PUBLIC_APP_URL (redirect)."
    );
  }
  return { oauth2 };
}
