import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { createClient } from "@/lib/supabase/server";

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
    .select("name, email, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const userName = profile?.name ?? user.email ?? "Usuário";
  const userEmail = profile?.email ?? user.email ?? null;
  const avatarUrl = profile?.avatar_url ?? null;

  return (
    <AppShell userName={userName} userEmail={userEmail} avatarUrl={avatarUrl}>
      {children}
    </AppShell>
  );
}
