"use client";

import { ClipboardList, Inbox } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const items = [
  { href: "/formularios/modelos", label: "Modelos", icon: ClipboardList },
  { href: "/formularios/recebidos", label: "Recebidos", icon: Inbox },
] as const;

export function FormulariosNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Seções de formulários">
      <ul className="flex flex-row gap-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-ds-xl px-3 py-2 text-sm font-medium transition-colors duration-ds ease-out",
                  active
                    ? "bg-ds-elevated text-ds-ink shadow-sm"
                    : "text-ds-muted hover:bg-ds-cream hover:text-ds-ink"
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
