import { NextResponse } from "next/server";

import { appOrigin } from "@/lib/app-url";
import { assertGoogleCalendarOAuthConfigured, signGoogleCalendarOAuthState } from "@/lib/google-calendar/oauth-state";
import { assertGoogleOAuthEnv, GOOGLE_CALENDAR_SCOPES } from "@/lib/google-calendar/oauth-client";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const reqUrl = new URL(request.url);
  const base = appOrigin() || reqUrl.origin;
  const settingsAgenda = `${base}/settings/agenda`;

  try {
    assertGoogleCalendarOAuthConfigured();
    assertGoogleOAuthEnv();
  } catch {
    return NextResponse.redirect(`${settingsAgenda}?calendar_error=server_config`);
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${base}/login`);
  }

  const { data: me, error: meErr } = await supabase
    .from("users")
    .select("account_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (meErr || !me?.account_id || me.role !== "admin") {
    return NextResponse.redirect(`${settingsAgenda}?calendar_error=forbidden`);
  }

  const { oauth2 } = assertGoogleOAuthEnv();
  const state = signGoogleCalendarOAuthState({
    accountId: me.account_id,
    userId: user.id,
    exp: Date.now() + 15 * 60 * 1000,
  });

  const authUrl = oauth2.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [...GOOGLE_CALENDAR_SCOPES],
    state,
  });

  return NextResponse.redirect(authUrl);
}
