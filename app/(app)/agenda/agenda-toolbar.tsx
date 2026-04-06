"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ToolbarProps, View } from "react-big-calendar";

import { cn } from "@/lib/utils";

const VIEW_TABS: { id: View; label: string }[] = [
  { id: "month", label: "Mês" },
  { id: "week", label: "Semana" },
  { id: "day", label: "Dia" },
];

export function AgendaToolbar(props: ToolbarProps) {
  const { label, onNavigate, onView, view } = props;

  return (
    <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-1 sm:gap-2">
        <button
          type="button"
          onClick={() => onNavigate("PREV")}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-ds-xl border border-app-border bg-app-sidebar text-ds-muted shadow-sm transition-colors hover:bg-ds-cream hover:text-ds-ink"
          aria-label="Período anterior"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </button>
        <h2 className="min-w-0 flex-1 px-1 text-center text-base font-semibold capitalize text-ds-ink sm:min-w-[11rem] sm:flex-none sm:px-2 sm:text-lg">
          {label}
        </h2>
        <button
          type="button"
          onClick={() => onNavigate("NEXT")}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-ds-xl border border-app-border bg-app-sidebar text-ds-muted shadow-sm transition-colors hover:bg-ds-cream hover:text-ds-ink"
          aria-label="Próximo período"
        >
          <ChevronRight className="h-5 w-5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => onNavigate("TODAY")}
          className="ml-0 inline-flex h-9 items-center rounded-ds-xl border border-app-border bg-app-sidebar px-3 text-sm font-medium text-ds-ink shadow-sm transition-colors hover:bg-ds-cream sm:ml-1"
        >
          Hoje
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div
          className="inline-flex rounded-ds-xl border border-app-border bg-app-sidebar p-1 shadow-ds-sm"
          role="tablist"
          aria-label="Visualização"
        >
          {VIEW_TABS.map(({ id, label: tabLabel }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={view === id}
              onClick={() => onView(id)}
              className={cn(
                "rounded-[0.65rem] px-3 py-2 text-sm font-medium transition-colors duration-ds ease-out",
                view === id
                  ? "bg-ds-cream text-ds-ink shadow-sm"
                  : "text-ds-muted hover:bg-ds-cream/70 hover:text-ds-ink"
              )}
            >
              {tabLabel}
            </button>
          ))}
        </div>
        <a
          href="https://calendar.google.com/calendar/u/0/r/eventedit"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 items-center justify-center rounded-ds-xl bg-app-primary px-4 text-sm font-semibold text-white shadow-sm transition-colors duration-ds ease-out hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-app-canvas"
        >
          + Novo evento
        </a>
      </div>
    </div>
  );
}
