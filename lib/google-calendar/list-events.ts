import { google } from "googleapis";

import { assertGoogleOAuthEnv } from "@/lib/google-calendar/oauth-client";
import { getValidAccessTokenForAccount } from "@/lib/google-calendar/access-token";

export type NormalizedCalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  description?: string;
  htmlLink?: string;
};

function eventBounds(e: {
  start?: { dateTime?: string | null; date?: string | null } | null;
  end?: { dateTime?: string | null; date?: string | null } | null;
}): { start: string; end: string; allDay: boolean } | null {
  const s = e.start?.dateTime ?? e.start?.date;
  const en = e.end?.dateTime ?? e.end?.date;
  if (!s || !en) return null;
  const allDay = Boolean(e.start?.date && !e.start?.dateTime);
  return { start: s, end: en, allDay };
}

export async function listCalendarEventsForAccount(
  accountId: string,
  timeMin: Date,
  timeMax: Date
): Promise<{ ok: true; events: NormalizedCalendarEvent[] } | { ok: false; error: string }> {
  const tokenRes = await getValidAccessTokenForAccount(accountId);
  if (!tokenRes.ok) return tokenRes;

  let oauth2;
  try {
    oauth2 = assertGoogleOAuthEnv().oauth2;
  } catch {
    return { ok: false, error: "OAuth Google não configurado no servidor." };
  }

  oauth2.setCredentials({ access_token: tokenRes.accessToken });
  const cal = google.calendar({ version: "v3", auth: oauth2 });

  try {
    const res = await cal.events.list({
      calendarId: tokenRes.row.calendar_id || "primary",
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 2500,
    });

    const items = res.data.items ?? [];
    const events: NormalizedCalendarEvent[] = [];

    for (const ev of items) {
      if (!ev.id) continue;
      const b = eventBounds(ev);
      if (!b) continue;
      events.push({
        id: ev.id,
        title: ev.summary ?? "(Sem título)",
        start: b.start,
        end: b.end,
        allDay: b.allDay,
        description: ev.description ?? undefined,
        htmlLink: ev.htmlLink ?? undefined,
      });
    }

    return { ok: true, events };
  } catch {
    return { ok: false, error: "Não foi possível carregar eventos do Google Calendar." };
  }
}
