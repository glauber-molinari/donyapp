import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { BlogSidebarWidget } from "@/components/layout/blog-sidebar-widget";
import { resolveDisplayAvatarUrl } from "@/lib/auth/resolve-display-avatar";
import { isFeatureEnabled } from "@/lib/feature-flags.server";
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
    .select("name, email, avatar_url, avatar_is_custom, tour_completed, account_id")
    .eq("id", user.id)
    .maybeSingle();

  const userName = profile?.name ?? user.email ?? "Usuário";
  const userEmail = profile?.email ?? user.email ?? null;
  const avatarUrl = resolveDisplayAvatarUrl(user, profile ?? undefined);
  const tourCompleted = profile == null ? true : profile.tour_completed;

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("account_id", profile?.account_id ?? "")
    .maybeSingle();

  const isPro = subscription?.plan === "pro";

  const galeriasEnabled = isPro && (await isFeatureEnabled("galerias"));

  const { count: unreadSupportCount } = await supabase
    .from("support_tickets")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("has_unread_reply", true);

  return (
    <AppShell
      userName={userName}
      userEmail={userEmail}
      avatarUrl={avatarUrl}
      tourCompleted={tourCompleted}
      isPro={isPro}
      galeriasEnabled={galeriasEnabled}
      unreadSupportCount={unreadSupportCount ?? 0}
      sidebarWidget={<BlogSidebarWidget />}
    >
      {children}
    </AppShell>
  );
}
