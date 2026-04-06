import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { oauthAvatarUrlFromUser } from "@/lib/auth/oauth-profile";
import { createClient } from "@/lib/supabase/server";

/** Área logada: não indexar; título por rota (dashboard, contatos, etc.). */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("name, email, avatar_url, tour_completed")
    .eq("id", user.id)
    .maybeSingle();

  const userName = profile?.name ?? user.email ?? "Usuário";
  const userEmail = profile?.email ?? user.email ?? null;
  const avatarUrl = profile?.avatar_url ?? oauthAvatarUrlFromUser(user) ?? null;
  const tourCompleted = profile == null ? true : profile.tour_completed;

  return (
    <AppShell
      userName={userName}
      userEmail={userEmail}
      avatarUrl={avatarUrl}
      tourCompleted={tourCompleted}
    >
      {children}
    </AppShell>
  );
}
