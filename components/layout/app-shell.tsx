"use client";

import {
  Calendar,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  LaptopMinimal,
  LayoutDashboard,
  Lightbulb,
  NotebookPen,
  LogOut,
  Menu,
  MessageCircle,
  Settings,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useState, type ReactNode } from "react";

import { OnboardingTourProvider } from "@/components/app/onboarding-tour";
import { SidebarCollapsedContext } from "@/components/layout/sidebar-collapsed-context";
import { AppToaster } from "@/components/ui/app-toaster";
import { Avatar } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { getSupportEmail, supportMailtoLink, supportWhatsAppLink } from "@/lib/support";
import { cn } from "@/lib/utils";

const SIDEBAR_COLLAPSED_KEY = "donyapp-sidebar-collapsed";

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
    href: "/tasks",
    label: "Tarefas",
    id: "menu-tarefas",
    icon: CheckSquare,
  },
  {
    href: "/notes",
    label: "Anotações",
    id: "menu-anotacoes",
    icon: NotebookPen,
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
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const persistSidebarCollapsed = useCallback((collapsed: boolean) => {
    try {
      window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

  /** Lê preferência antes do paint para alinhar layout com a largura real da coluna (evita scroll horizontal fantasma). */
  useLayoutEffect(() => {
    try {
      if (window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1") {
        setSidebarCollapsed(true);
      }
    } catch {
      /* ignore */
    }
  }, []);
  const supportEmail = getSupportEmail();
  const helpBody = `Olá, equipe Donyapp.\n\nEstou na tela: ${pathname}\nPreciso de ajuda com: `;
  const helpMail = supportMailtoLink({
    subject: "Ajuda | Donyapp",
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

  const linkClass = (href: string, collapsed: boolean) =>
    cn(
      "flex items-center gap-3 rounded-ds-xl px-3 py-2.5 text-sm font-medium transition-colors duration-ds ease-out",
      collapsed && "md:justify-center md:gap-0 md:px-2 md:py-3",
      pathname === href ||
        (href !== "/dashboard" && href !== "/" && pathname.startsWith(href))
        ? "bg-ds-cream text-ds-ink font-semibold"
        : "text-ds-muted hover:bg-ds-cream/80 hover:text-ds-ink"
    );

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // Se falhar no client, ainda tentamos limpar cookies no servidor.
    }

    try {
      await fetch("/auth/signout", { method: "POST" });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  };

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
          "fixed inset-y-0 left-0 z-50 flex shrink-0 flex-col overflow-hidden border-r border-app-border bg-app-sidebar transition-[transform,width] duration-200 ease-out md:static md:z-0 md:translate-x-0",
          mobileOpen ? "w-60 translate-x-0" : "-translate-x-full max-md:w-60 md:translate-x-0",
          !mobileOpen && (sidebarCollapsed ? "md:w-[4.25rem]" : "md:w-60")
        )}
      >
        {/* Mobile: logo + fechar */}
        <div className="relative flex h-14 items-center justify-center border-b border-app-border px-4 md:hidden md:h-16">
          <Link
            href="/dashboard"
            className="flex items-center justify-center"
            aria-label="Donyapp, início"
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
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-ds-xl p-2 text-ds-subtle hover:bg-ds-cream"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Desktop: expandido — logo + recolher (só md+, nunca junto do bloco recolhido) */}
        <div
          className={cn(
            "relative h-16 max-md:hidden shrink-0 items-center justify-between gap-2 border-b border-app-border px-3",
            sidebarCollapsed ? "hidden" : "flex"
          )}
        >
          <Link
            href="/dashboard"
            className="flex min-w-0 flex-1 items-center"
            aria-label="Donyapp, início"
          >
            <Image
              src="/brand/logo-dony-png.png"
              alt="Donyapp"
              width={120}
              height={32}
              className="h-9 w-auto max-w-[9rem] object-contain object-left"
              priority
            />
          </Link>
          <button
            type="button"
            onClick={() => {
              setSidebarCollapsed(true);
              persistSidebarCollapsed(true);
            }}
            className="shrink-0 rounded-ds-xl p-2 text-ds-muted transition-colors hover:bg-ds-cream hover:text-ds-ink"
            aria-expanded
            aria-controls="app-sidebar-nav"
            aria-label="Recolher menu lateral"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
        </div>

        {/* Desktop: recolhido — expandir + ícone compacto */}
        <div
          className={cn(
            "max-md:hidden shrink-0 flex-col items-center gap-2 border-b border-app-border py-3",
            sidebarCollapsed ? "flex" : "hidden"
          )}
        >
          <button
            type="button"
            onClick={() => {
              setSidebarCollapsed(false);
              persistSidebarCollapsed(false);
            }}
            className="rounded-ds-xl p-2 text-ds-muted transition-colors hover:bg-ds-cream hover:text-ds-ink"
            aria-expanded={false}
            aria-controls="app-sidebar-nav"
            aria-label="Expandir menu lateral"
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>
          <Link
            href="/dashboard"
            className="flex justify-center"
            aria-label="Donyapp, início"
            title="Início"
          >
            <Image
              src="/brand/icon-dony-laranja.png"
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 object-contain"
            />
          </Link>
        </div>

        <nav
          id="app-sidebar-nav"
          className={cn(
            "flex flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden p-3",
            sidebarCollapsed && "md:items-stretch md:px-2"
          )}
          aria-label="Principal"
        >
          {navItems.map(({ href, label, id, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              id={id}
              title={sidebarCollapsed ? label : undefined}
              className={linkClass(href, sidebarCollapsed)}
            >
              <Icon className="h-5 w-5 shrink-0 opacity-80" aria-hidden />
              <span className={cn(sidebarCollapsed && "md:sr-only")}>{label}</span>
            </Link>
          ))}
        </nav>

        <div
          className={cn(
            "border-t border-app-border px-3 pb-2 pt-1",
            sidebarCollapsed && "md:px-2"
          )}
        >
          <p
            className={cn(
              "px-3 pb-1 text-sm font-medium uppercase tracking-wide text-ds-subtle",
              sidebarCollapsed && "md:sr-only"
            )}
          >
            Ajuda
          </p>
          <div className="flex flex-col gap-0.5">
            <a
              href={helpMail}
              title={sidebarCollapsed ? `E-mail (${supportEmail})` : undefined}
              className={cn(
                "flex items-center gap-3 rounded-ds-xl px-3 py-2.5 text-sm font-medium text-ds-muted transition-colors duration-ds ease-out hover:bg-ds-cream/80 hover:text-ds-ink",
                sidebarCollapsed && "md:justify-center md:px-2 md:py-3"
              )}
            >
              <HelpCircle className="h-5 w-5 shrink-0 opacity-80" aria-hidden />
              <span className={cn(sidebarCollapsed && "md:sr-only")}>
                E-mail ({supportEmail})
              </span>
            </a>
            {helpWhats ? (
              <a
                href={helpWhats}
                target="_blank"
                rel="noopener noreferrer"
                title={sidebarCollapsed ? "WhatsApp" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-ds-xl px-3 py-2.5 text-sm font-medium text-ds-muted transition-colors duration-ds ease-out hover:bg-ds-cream/80 hover:text-ds-ink",
                  sidebarCollapsed && "md:justify-center md:px-2 md:py-3"
                )}
              >
                <MessageCircle className="h-5 w-5 shrink-0 opacity-80" aria-hidden />
                <span className={cn(sidebarCollapsed && "md:sr-only")}>WhatsApp</span>
              </a>
            ) : null}
            <Link
              href="/feedback"
              id="menu-feedback"
              title={sidebarCollapsed ? "Feedback" : undefined}
              className={linkClass("/feedback", sidebarCollapsed)}
            >
              <Lightbulb className="h-5 w-5 shrink-0 opacity-80" aria-hidden />
              <span className={cn(sidebarCollapsed && "md:sr-only")}>Feedback</span>
            </Link>
          </div>
        </div>

        <div className={cn("border-t border-app-border p-3", sidebarCollapsed && "md:px-2")}>
          <div
            className={cn(
              "mb-1 flex min-h-[2.5rem] items-center gap-3 rounded-ds-xl px-3 py-2.5",
              sidebarCollapsed && "md:justify-center md:px-0"
            )}
          >
            <Avatar src={avatarUrl} name={userName} size="xs" />
            <div
              className={cn(
                "min-w-0 flex-1 leading-snug",
                sidebarCollapsed && "md:sr-only md:flex-none md:min-w-0"
              )}
            >
              <p className="truncate text-sm font-medium text-ds-ink">{userName}</p>
              {userEmail ? (
                <p className="truncate text-sm font-medium text-ds-muted">{userEmail}</p>
              ) : null}
            </div>
          </div>
          <Link
            href="/settings/kanban"
            id="menu-settings"
            title={sidebarCollapsed ? "Configurações" : undefined}
            className={linkClass("/settings", sidebarCollapsed)}
          >
            <Settings className="h-5 w-5 shrink-0 opacity-80" aria-hidden />
            <span className={cn(sidebarCollapsed && "md:sr-only")}>Configurações</span>
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            title={sidebarCollapsed ? "Sair" : undefined}
            className={cn(
              "mt-1 flex w-full items-center gap-3 rounded-ds-xl px-3 py-2.5 text-left text-sm font-medium text-ds-muted transition-colors duration-ds ease-out hover:bg-ds-cream/80 hover:text-ds-ink",
              sidebarCollapsed && "md:justify-center md:px-2 md:py-3"
            )}
          >
            <LogOut className="h-5 w-5 shrink-0 opacity-80" aria-hidden />
            <span className={cn(sidebarCollapsed && "md:sr-only")}>Sair</span>
          </button>
        </div>
      </aside>

      <SidebarCollapsedContext.Provider value={sidebarCollapsed}>
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

          <main className="min-w-0 flex-1 overflow-auto px-4 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] sm:px-6 sm:pt-6 sm:pb-8">
            {children}
          </main>
        </div>
      </SidebarCollapsedContext.Provider>
      <AppToaster />
    </div>
    </OnboardingTourProvider>
  );
}
