import { google } from "googleapis";
import { NextResponse } from "next/server";

import { appOrigin } from "@/lib/app-url";
import { getIntegrationByAccountId, upsertIntegration } from "@/lib/google-calendar/integration-db";
import { assertGoogleOAuthEnv } from "@/lib/google-calendar/oauth-client";
import { verifyGoogleCalendarOAuthState } from "@/lib/google-calendar/oauth-state";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const reqUrl = new URL(request.url);
  const base = appOrigin() || reqUrl.origin;
  const settingsAgenda = `${base}/settings/agenda`;

  const errParam = reqUrl.searchParams.get("error");
  if (errParam) {
    return NextResponse.redirect(`${settingsAgenda}?calendar_error=denied`);
  }

  const code = reqUrl.searchParams.get("code");
  const state = reqUrl.searchParams.get("state");
  if (!code || !state) {
    return NextResponse.redirect(`${settingsAgenda}?calendar_error=invalid_request`);
  }

  const payload = verifyGoogleCalendarOAuthState(state);
  if (!payload) {
    return NextResponse.redirect(`${settingsAgenda}?calendar_error=invalid_state`);
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id !== payload.userId) {
    return NextResponse.redirect(`${settingsAgenda}?calendar_error=session`);
  }

  const { data: me, error: meErr } = await supabase
    .from("users")
    .select("account_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (
    meErr ||
    !me?.account_id ||
    me.account_id !== payload.accountId ||
    me.role !== "admin"
  ) {
    return NextResponse.redirect(`${settingsAgenda}?calendar_error=forbidden`);
  }

  const svc = createServiceRoleClient();
  if (!svc) {
    return NextResponse.redirect(`${settingsAgenda}?calendar_error=config`);
  }

  let oauth2;
  try {
    oauth2 = assertGoogleOAuthEnv().oauth2;
  } catch {
    return NextResponse.redirect(`${settingsAgenda}?calendar_error=server_config`);
  }

  try {
    const { tokens } = await oauth2.getToken(code);
    const existing = await getIntegrationByAccountId(me.account_id);
    const refreshToken = tokens.refresh_token ?? existing?.refresh_token ?? null;
    if (!refreshToken) {
      return NextResponse.redirect(`${settingsAgenda}?calendar_error=no_refresh`);
    }

    oauth2.setCredentials(tokens);

    let googleEmail: string | null = null;
    try {
      const oauth2User = google.oauth2({ version: "v2", auth: oauth2 });
      const ui = await oauth2User.userinfo.get();
      googleEmail = ui.data.email ?? null;
    } catch {
      /* e-mail opcional */
    }

    const accessTokenExpiresAt =
      tokens.expiry_date != null ? new Date(tokens.expiry_date).toISOString() : null;

    const saved = await upsertIntegration({
      accountId: me.account_id,
      refreshToken,
      accessToken: tokens.access_token ?? null,
      accessTokenExpiresAt: accessTokenExpiresAt,
      googleEmail,
      calendarId: "primary",
    });

    if (!saved.ok) {
      return NextResponse.redirect(`${settingsAgenda}?calendar_error=save`);
    }

    return NextResponse.redirect(`${settingsAgenda}?calendar_connected=1`);
  } catch {
    return NextResponse.redirect(`${settingsAgenda}?calendar_error=token`);
  }
}
