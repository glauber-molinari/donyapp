"use client";

import { CalendarDays } from "lucide-react";
import Link from "next/link";

import { AgendaCalendar } from "./agenda-calendar";
import { Card } from "@/components/ui/card";
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
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ds-ink">Agenda</h1>
          <p className="mt-1 text-sm text-ds-muted">
            {googleEmail ? (
              <>
                Sincronizado com <span className="font-medium text-ds-ink">{googleEmail}</span> (calendário
                principal).
              </>
            ) : (
              "Eventos do Google Calendar conectado ao estúdio."
            )}
          </p>
        </div>
      </div>

      <Card className="border-app-border bg-ds-cream/40 px-4 py-2.5 shadow-none">
        <p className="text-xs text-ds-muted">
          {isAdmin ? (
            <>
              Para trocar ou desconectar a conta Google, use{" "}
              <Link
                href="/settings/agenda"
                className="font-medium text-app-primary underline-offset-2 hover:underline"
              >
                Configurações → Agenda
              </Link>
              .
            </>
          ) : (
            "Somente administradores podem alterar qual conta Google está conectada."
          )}
        </p>
      </Card>

      <AgendaCalendar />
    </div>
  );
}
