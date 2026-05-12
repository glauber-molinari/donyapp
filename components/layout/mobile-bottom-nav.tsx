"use client";

import {
  Calendar,
  LaptopMinimal,
  LayoutDashboard,
  Menu,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

interface MobileBottomNavProps {
  onOpenMore: () => void;
}

const bottomNavItems = [
  { href: "/dashboard", label: "Início", icon: LayoutDashboard },
  { href: "/contacts", label: "Contatos", icon: Users },
  { href: "/board", label: "Edições", icon: LaptopMinimal },
  { href: "/agenda", label: "Agenda", icon: Calendar },
] as const;

function isActive(pathname: string, href: string) {
  if (pathname === href) return true;
  if (href === "/dashboard") return false;
  return pathname.startsWith(href);
}

export function MobileBottomNav({ onOpenMore }: MobileBottomNavProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação principal mobile"
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 md:hidden",
        "border-t border-app-border bg-app-sidebar/95 backdrop-blur supports-[backdrop-filter]:bg-app-sidebar/80",
        "pb-[env(safe-area-inset-bottom,0px)]"
      )}
    >
      <ul className="grid grid-cols-5">
        {bottomNavItems.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href} className="flex">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex w-full min-h-[56px] flex-col items-center justify-center gap-0.5 px-1 pb-1 pt-1.5 text-[10px] font-medium leading-tight transition-colors",
                  active
                    ? "text-ds-accent"
                    : "text-ds-muted hover:text-ds-ink"
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-12 items-center justify-center rounded-full transition-colors",
                    active && "bg-ds-accent/10"
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="truncate">{label}</span>
              </Link>
            </li>
          );
        })}
        <li className="flex">
          <button
            type="button"
            onClick={onOpenMore}
            aria-label="Abrir menu completo"
            className={cn(
              "flex w-full min-h-[56px] flex-col items-center justify-center gap-0.5 px-1 pb-1 pt-1.5 text-[10px] font-medium leading-tight transition-colors",
              "text-ds-muted hover:text-ds-ink"
            )}
          >
            <span className="flex h-7 w-12 items-center justify-center rounded-full">
              <Menu className="h-5 w-5" aria-hidden />
            </span>
            <span>Mais</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
