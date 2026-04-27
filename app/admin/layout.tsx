import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { isPlatformAdminEmail } from "@/lib/admin/platform-admin";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Admin | Donyapp",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!isPlatformAdminEmail(user.email)) {
    redirect("/dashboard");
  }

  const nav = [
    { href: "/admin", label: "Visão geral" },
    { href: "/admin/planos", label: "Planos e contas" },
    { href: "/admin/feedback", label: "Feedback" },
    { href: "/admin/apresentacao", label: "Apresentação" },
  ] as const;

  return (
    <div className="min-h-screen bg-app-canvas text-ds-ink">
      <header className="border-b border-app-border bg-app-sidebar">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-ds-muted">Donyapp</p>
            <h1 className="text-lg font-semibold">Painel administrativo</h1>
            <p className="text-xs text-ds-muted">{user.email}</p>
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            {nav.map((item) => (
              <AdminNavLink key={item.href} href={item.href}>
                {item.label}
              </AdminNavLink>
            ))}
            <Link
              href="/dashboard"
              className="rounded-ds-lg px-3 py-2 text-sm font-medium text-app-primary hover:bg-ds-cream"
            >
              Voltar ao app
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}

function AdminNavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-ds-lg px-3 py-2 text-sm font-medium text-ds-muted hover:bg-ds-cream hover:text-ds-ink"
      )}
    >
      {children}
    </Link>
  );
}
