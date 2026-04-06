"use client";

import {
  Calendar,
  HelpCircle,
  LaptopMinimal,
  LayoutDashboard,
  Menu,
  MessageCircle,
  Settings,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { OnboardingTourProvider } from "@/components/app/onboarding-tour";
import { AppToaster } from "@/components/ui/app-toaster";
import { Avatar } from "@/components/ui/avatar";
import { getSupportEmail, supportMailtoLink, supportWhatsAppLink } from "@/lib/support";
import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    id: "menu-dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/contacts",
    label: "Contatos",
    id: "menu-contatos",
    icon: Users,
  },
  {
    href: "/board",
    label: "Edições",
    id: "menu-edicoes",
    icon: LaptopMinimal,
  },
  {
    href: "/agenda",
    label: "Agenda",
    id: "menu-agenda",
    icon: Calendar,
  },
] as const;

export interface AppShellProps {
  children: ReactNode;
  userName: string;
  userEmail: string | null;
  avatarUrl: string | null;
  tourCompleted: boolean;
}

export function AppShell({ children, userName, userEmail, avatarUrl, tourCompleted }: AppShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const supportEmail = getSupportEmail();
  const helpBody = `Olá, equipe Donyapp.\n\nEstou na tela: ${pathname}\nPreciso de ajuda com: `;
  const helpMail = supportMailtoLink({
    subject: "Ajuda — Donyapp",
    body: helpBody,
  });
  const helpWhats = supportWhatsAppLink(helpBody);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const linkClass = (href: string) =>
    cn(
      "flex items-center gap-3 rounded-ds-xl px-3 py-2.5 text-sm font-medium transition-colors duration-ds ease-out",
      pathname === href ||
        (href !== "/dashboard" && href !== "/" && pathname.startsWith(href))
        ? "bg-ds-cream text-ds-ink font-semibold"
        : "text-ds-muted hover:bg-ds-cream/80 hover:text-ds-ink"
    );

  return (
    <OnboardingTourProvider tourCompleted={tourCompleted}>
    <div className="flex min-h-screen bg-app-canvas">
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-ds-ink/30 md:hidden"
          aria-label="Fechar menu"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-app-border bg-app-sidebar transition-transform duration-ds ease-out md:static md:z-0 md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="relative flex h-14 items-center justify-center border-b border-app-border px-4 md:h-16">
          <Link
            href="/dashboard"
            className="flex items-center justify-center"
            aria-label="Donyapp — início"
          >
            <Image
              src="/brand/logo-dony-png.png"
              alt="Donyapp"
              width={120}
              height={32}
              className="h-9 w-auto max-w-[9.5rem] object-contain"
              priority
            />
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-ds-xl p-2 text-ds-subtle hover:bg-ds-cream md:hidden"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Principal">
          {navItems.map(({ href, label, id, icon: Icon }) => (
            <Link key={href} href={href} id={id} className={linkClass(href)}>
              <Icon className="h-5 w-5 shrink-0 opacity-80" aria-hidden />
              {label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-app-border px-3 pb-2 pt-1">
          <p className="px-3 pb-1 text-[0.65rem] font-semibold uppercase tracking-wide text-ds-subtle">
            Ajuda
          </p>
          <div className="flex flex-col gap-0.5">
            <a
              href={helpMail}
              className="flex items-center gap-3 rounded-ds-xl px-3 py-2.5 text-sm font-medium text-ds-muted transition-colors duration-ds ease-out hover:bg-ds-cream/80 hover:text-ds-ink"
            >
              <HelpCircle className="h-5 w-5 shrink-0 opacity-80" aria-hidden />
              E-mail ({supportEmail})
            </a>
            {helpWhats ? (
              <a
                href={helpWhats}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-ds-xl px-3 py-2.5 text-sm font-medium text-ds-muted transition-colors duration-ds ease-out hover:bg-ds-cream/80 hover:text-ds-ink"
              >
                <MessageCircle className="h-5 w-5 shrink-0 opacity-80" aria-hidden />
                WhatsApp
              </a>
            ) : null}
          </div>
        </div>

        <div className="border-t border-app-border p-3">
          <div className="mb-3 flex items-center gap-3 rounded-ds-xl px-2 py-2">
            <Avatar src={avatarUrl} name={userName} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ds-ink">{userName}</p>
              {userEmail ? (
                <p className="truncate text-xs text-ds-muted">{userEmail}</p>
              ) : null}
            </div>
          </div>
          <Link href="/settings/kanban" id="menu-settings" className={linkClass("/settings")}>
            <Settings className="h-5 w-5 shrink-0 opacity-80" aria-hidden />
            Configurações
          </Link>
          <form action="/auth/signout" method="post" className="mt-2 px-1">
            <button
              type="submit"
              className="w-full rounded-ds-xl px-3 py-2 text-left text-sm font-medium text-ds-subtle transition-colors duration-ds ease-out hover:bg-ds-cream hover:text-ds-ink"
            >
              Sair
            </button>
          </form>
        </div>

      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-app-border bg-app-sidebar px-4 md:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-ds-xl p-2 text-ds-muted hover:bg-ds-cream"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-base font-semibold text-ds-ink">Donyapp</span>
        </header>

        <main className="flex-1 overflow-auto px-4 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] sm:px-6 sm:pt-6 sm:pb-8">
          {children}
        </main>
      </div>
      <AppToaster />
    </div>
    </OnboardingTourProvider>
  );
}
