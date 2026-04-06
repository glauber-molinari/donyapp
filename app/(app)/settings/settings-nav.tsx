"use client";

import { Calendar, Columns3, CreditCard, Mail, UserCircle, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const items = [
  { href: "/settings/profile", label: "Perfil", icon: UserCircle },
  { href: "/settings/kanban", label: "Kanban", icon: Columns3 },
  { href: "/settings/team", label: "Equipe", icon: Users },
  { href: "/settings/email", label: "E-mail", icon: Mail },
  { href: "/settings/agenda", label: "Agenda", icon: Calendar },
  { href: "/settings/plan", label: "Plano", icon: CreditCard },
] as const;

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Seções de configurações">
      <ul className="flex flex-row gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                className={cn(
                  "flex items-center gap-2.5 rounded-ds-xl px-3 py-2.5 text-sm font-medium transition-colors duration-ds ease-out",
                  active
                    ? "bg-ds-cream text-ds-ink shadow-sm"
                    : "text-ds-muted hover:bg-ds-cream/70 hover:text-ds-ink"
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-4 w-4 shrink-0 opacity-85" aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
