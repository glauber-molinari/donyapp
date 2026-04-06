"use client";

import { CalendarDays } from "lucide-react";
import Link from "next/link";

import { AgendaCalendar } from "./agenda-calendar";
import { EmptyState } from "@/components/ui/empty-state";

export function AgendaView({
  connected,
  googleEmail,
  isAdmin,
}: {
  connected: boolean;
  googleEmail: string | null;
  isAdmin: boolean;
}) {
  if (!connected) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="Nenhuma agenda conectada"
        description={
          isAdmin
            ? "Conecte a conta Google do estúdio em Configurações → Agenda. A equipe passará a ver os eventos aqui."
            : "Peça a um administrador para conectar o Google Calendar em Configurações → Agenda."
        }
      >
        {isAdmin ? (
          <Link
            href="/settings/agenda"
            className="inline-flex h-10 items-center justify-center rounded-ds-xl bg-app-primary px-4 text-sm font-medium text-white shadow-sm transition-colors duration-ds ease-out hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-app-canvas"
          >
            Ir para Configurações
          </Link>
        ) : null}
      </EmptyState>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ds-ink">Agenda</h1>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-ds-muted">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-900 ring-1 ring-emerald-200/80">
              <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" aria-hidden />
              <span className="font-medium">Google Calendar conectado</span>
            </span>
            {googleEmail ? (
              <span className="text-ds-subtle">
                · <span className="text-ds-ink">{googleEmail}</span>
              </span>
            ) : null}
          </p>
        </div>
      </header>

      <AgendaCalendar isAdmin={isAdmin} />
    </div>
  );
}
