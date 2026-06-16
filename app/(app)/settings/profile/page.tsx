import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { oauthAvatarUrlFromUser } from "@/lib/auth/oauth-profile";
import { resolveDisplayAvatarUrl } from "@/lib/auth/resolve-display-avatar";
import { createClient } from "@/lib/supabase/server";

import { ProfileAvatarSection } from "./profile-avatar-section";
import { ProfileCompanyNameSection } from "./profile-company-name-section";
import { ProfileTourReset } from "./profile-tour-reset";

export const metadata: Metadata = {
  title: "Perfil",
};

export default async function SettingsProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("name, email, avatar_url, avatar_is_custom, account_id, role")
    .eq("id", user.id)
    .maybeSingle();

  const { data: account } = profile?.account_id
    ? await supabase
        .from("accounts")
        .select("name")
        .eq("id", profile.account_id)
        .maybeSingle()
    : { data: null };

  const displayName = profile?.name ?? user.email ?? "Usuário";
  const email = profile?.email ?? user.email ?? "—";
  const companyName = account?.name ?? displayName;
  const isAdmin = profile?.role === "admin";
  const oauthAvatar = oauthAvatarUrlFromUser(user);
  const avatarSrc = resolveDisplayAvatarUrl(user, profile ?? undefined);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-lg font-semibold text-ds-ink">Perfil</h2>
        <p className="mt-1 text-sm text-ds-muted">
          Nome e e-mail vêm da sua conta Google. O e-mail entra como resposta (reply-to) nos envios ao
          cliente no plano Pro. A foto você pode trocar aqui; se enviar uma imagem, ela passa a valer no
          app em vez da foto do Google (até você voltar atrás). O nome da empresa é o que o cliente vê na
          galeria.
        </p>
      </div>

      <ProfileAvatarSection
        displayName={displayName}
        email={email}
        avatarSrc={avatarSrc}
        avatarIsCustom={profile?.avatar_is_custom ?? false}
        hasOauthAvatar={Boolean(oauthAvatar)}
      />

      <ProfileCompanyNameSection initialCompanyName={companyName} isAdmin={isAdmin} />

      <ProfileTourReset />
    </div>
  );
}
