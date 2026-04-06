import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { acceptInvitationForNewUser } from "@/lib/auth/accept-invitation";
import { oauthAvatarUrlFromUser } from "@/lib/auth/oauth-profile";
import { provisionNewStudio } from "@/lib/auth/provision-new-studio";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import type { Database } from "@/types/database";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  let nextPath = searchParams.get("next") ?? "/dashboard";
  if (!nextPath.startsWith("/") || nextPath.startsWith("//")) {
    nextPath = "/dashboard";
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.redirect(`${origin}/login?error=config`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  let response = NextResponse.redirect(`${origin}${nextPath}`);

  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        response = NextResponse.redirect(`${origin}${nextPath}`);
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!existing) {
    const service = createServiceRoleClient();
    const db = service ?? supabase;
    if (!service) {
      console.warn(
        "auth/callback: SUPABASE_SERVICE_ROLE_KEY ausente — convites/provisionamento podem falhar."
      );
    }

    const inviteMatch = /^\/invite\/([^/?#]+)/.exec(nextPath);
    const inviteToken = inviteMatch?.[1];

    if (inviteToken) {
      if (!service) {
        return NextResponse.redirect(`${origin}/login?error=invite_config`);
      }
      const accepted = await acceptInvitationForNewUser(service, user, inviteToken);
      if (accepted.ok) {
        return response;
      }
      const err =
        accepted.reason === "email"
          ? "invite_email"
          : accepted.reason === "exists"
            ? "invite_exists"
            : "invite_invalid";
      return NextResponse.redirect(`${origin}/login?error=${err}`);
    }

    const result = await provisionNewStudio(db, user);
    if (!result.ok) {
      console.error("provisionNewStudio:", result.message);
      return NextResponse.redirect(`${origin}/login?error=provision`);
    }
  }

  const remoteAvatar = oauthAvatarUrlFromUser(user);
  if (remoteAvatar) {
    const { error: avatarErr } = await supabase
      .from("users")
      .update({ avatar_url: remoteAvatar })
      .eq("id", user.id);
    if (avatarErr) {
      console.warn("auth/callback: falha ao sincronizar avatar_url:", avatarErr.message);
    }
  }

  return response;
}
