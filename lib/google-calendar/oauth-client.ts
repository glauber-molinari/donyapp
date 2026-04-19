import { google } from "googleapis";

import { googleCalendarOAuthRedirectUri } from "@/lib/app-url";

/** Escopos mínimos para Agenda: lista do calendário primary, eventos só em calendários próprios, e-mail da conta (exibição). */
export const GOOGLE_CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
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
