import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Avatar } from "@/components/ui/avatar";
import { oauthAvatarUrlFromUser } from "@/lib/auth/oauth-profile";
import { createClient } from "@/lib/supabase/server";

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
    .select("name, email, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const displayName = profile?.name ?? user.email ?? "Usuário";
  const email = profile?.email ?? user.email ?? "—";

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-lg font-semibold text-ds-ink">Perfil</h2>
        <p className="mt-1 text-sm text-ds-muted">
          Nome e e-mail vêm da sua conta Google. O e-mail é usado como resposta (reply-to) nos envios ao
          cliente no plano Pro.
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-ds-xl border border-app-border bg-app-sidebar p-5 shadow-sm sm:flex-row sm:items-center sm:gap-6">
        <Avatar
          src={profile?.avatar_url ?? oauthAvatarUrlFromUser(user) ?? null}
          name={displayName}
          size="lg"
        />
        <div className="min-w-0 space-y-1">
          <p className="text-base font-semibold text-ds-ink">{displayName}</p>
          <p className="truncate text-sm text-ds-muted">{email}</p>
        </div>
      </div>

      <ProfileTourReset />
    </div>
  );
}
