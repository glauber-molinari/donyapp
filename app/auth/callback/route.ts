import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { publicAppOrigin } from "@/lib/app-url";
import { acceptInvitationForNewUser } from "@/lib/auth/accept-invitation";
import { inviteTokenFromNext, normalizeNextPath } from "@/lib/auth/next-path";
import { oauthAvatarUrlFromUser } from "@/lib/auth/oauth-profile";
import { provisionNewStudio } from "@/lib/auth/provision-new-studio";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import type { Database } from "@/types/database";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const origin = publicAppOrigin(request);
  const code = searchParams.get("code");
  const type = searchParams.get("type");

  const nextPath = normalizeNextPath(searchParams.get("next"));

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.redirect(`${origin}/login?error=config`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  // Destino final: recovery vai para redefinição de senha; demais fluxos seguem nextPath.
  let redirectPath = type === "recovery" ? "/auth/reset-password" : nextPath;

  let response = NextResponse.redirect(`${origin}${redirectPath}`);

  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        response = NextResponse.redirect(`${origin}${redirectPath}`);
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

  // Fluxo de recuperação de senha: sessão estabelecida, redireciona para redefinir senha.
  // Não provisionar — o usuário já existe.
  if (type === "recovery") {
    return response;
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

    const inviteToken = inviteTokenFromNext(nextPath);

    if (inviteToken) {
      if (!service) {
        return NextResponse.redirect(`${origin}/login?error=invite_config`);
      }
      const accepted = await acceptInvitationForNewUser(service, user, inviteToken);
      if (accepted.ok) {
        redirectPath = "/dashboard";
        const dashResponse = NextResponse.redirect(`${origin}${redirectPath}`);
        response.cookies.getAll().forEach((c) => {
          dashResponse.cookies.set(c.name, c.value);
        });
        return dashResponse;
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
    const { data: avatarRow } = await supabase
      .from("users")
      .select("avatar_is_custom")
      .eq("id", user.id)
      .maybeSingle();

    if (!avatarRow?.avatar_is_custom) {
      const { error: avatarErr } = await supabase
        .from("users")
        .update({ avatar_url: remoteAvatar })
        .eq("id", user.id);
      if (avatarErr) {
        console.warn("auth/callback: falha ao sincronizar avatar_url:", avatarErr.message);
      }
    }
  }

  return response;
}
