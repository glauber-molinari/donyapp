"use client";

import { Clapperboard, LayoutDashboard, Menu, Settings, Users, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { Avatar } from "@/components/ui/avatar";
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
    icon: Clapperboard,
  },
] as const;

export interface AppShellProps {
  children: ReactNode;
  userName: string;
  userEmail: string | null;
  avatarUrl: string | null;
}

export function AppShell({ children, userName, userEmail, avatarUrl }: AppShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

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
      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
      pathname === href ||
        (href !== "/dashboard" && href !== "/" && pathname.startsWith(href))
        ? "bg-violet-100 text-violet-700"
        : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
    );

  return (
    <div className="flex min-h-screen bg-app-canvas">
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          aria-label="Fechar menu"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-gray-200 bg-white transition-transform duration-200 md:static md:z-0 md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-gray-200 px-4 md:h-16">
          <Link
            href="/dashboard"
            className="text-lg font-semibold tracking-tight text-gray-800"
          >
            Donyapp
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 md:hidden"
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

        <div className="border-t border-gray-200 p-3">
          <div className="mb-3 flex items-center gap-3 rounded-xl px-2 py-2">
            <Avatar src={avatarUrl} name={userName} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-800">{userName}</p>
              {userEmail ? (
                <p className="truncate text-xs text-gray-500">{userEmail}</p>
              ) : null}
            </div>
          </div>
          <Link href="/settings" id="menu-settings" className={linkClass("/settings")}>
            <Settings className="h-5 w-5 shrink-0 opacity-80" aria-hidden />
            Configurações
          </Link>
          <form action="/auth/signout" method="post" className="mt-2 px-1">
            <button
              type="submit"
              className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
            >
              Sair
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-gray-200 bg-white px-4 md:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-base font-semibold text-gray-800">Donyapp</span>
        </header>

        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
