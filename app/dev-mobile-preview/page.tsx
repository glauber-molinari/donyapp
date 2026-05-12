/**
 * Dev-only preview page for mobile UI (skips auth).
 * DELETE before commit. Not linked from anywhere.
 */
import { Plus } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";

export const dynamic = "force-dynamic";

export default function DevMobilePreviewPage() {
  if (process.env.NODE_ENV !== "development") {
    return <div className="p-8">Not available in production.</div>;
  }

  return (
    <AppShell
      userName="Glauber Molinari"
      userEmail="glauber@donyapp.com"
      avatarUrl={null}
      tourCompleted
      isPro
      unreadSupportCount={2}
    >
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-ds-ink">Dashboard (preview)</h1>
          <p className="mt-1 text-sm text-ds-muted">
            Preview de UI mobile — esta página existe apenas em dev para inspeção do
            bottom nav + header mobile + FAB.
          </p>
        </header>

        {/* Mock FAB — replica o FAB do /board em mobile para validar posição */}
        <button
          type="button"
          aria-label="Novo job (FAB demo)"
          className="fixed right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-app-primary text-white shadow-lg shadow-app-primary/30 md:hidden"
          style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 5rem)" }}
        >
          <Plus className="h-6 w-6" aria-hidden />
        </button>

        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { label: "Edições ativas", value: "12" },
            { label: "Prazos esta semana", value: "4" },
            { label: "Contatos", value: "37" },
            { label: "Tarefas pendentes", value: "8" },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-ds-xl border border-app-border bg-app-sidebar p-4 shadow-ds-sm"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-ds-subtle">
                {card.label}
              </p>
              <p className="mt-1 text-2xl font-bold text-ds-ink">{card.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-ds-xl border border-app-border bg-app-sidebar p-4 shadow-ds-sm">
          <h2 className="text-sm font-semibold text-ds-ink">Próximos prazos</h2>
          <ul className="mt-3 divide-y divide-app-border">
            {[
              "Casamento Ana & Pedro — sex 15",
              "Ensaio Maternidade — sáb 16",
              "Aniversário Sofia — dom 17",
              "Pré-wedding Marina — seg 18",
            ].map((item) => (
              <li key={item} className="py-2.5 text-sm text-ds-muted">
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Mock kanban — verifica scroll-snap + bottom nav fixo durante scroll horizontal */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-ds-ink">Mock Kanban (teste scroll horizontal)</h2>
          <div className="w-full min-w-0 overflow-x-auto scroll-smooth pb-4 pt-1 [scrollbar-width:thin] overscroll-x-contain touch-pan-x snap-x snap-mandatory scroll-pl-1">
            <div className="flex w-max min-w-full flex-nowrap gap-3 px-1">
              {["Backup", "Em edição", "Aprovação", "Ajustes", "Entregue", "Arquivado", "Cancelado"].map((stage, i) => (
                <div
                  key={stage}
                  className="flex w-[min(80vw,18rem)] shrink-0 snap-start flex-col gap-2 rounded-xl border border-ds-border bg-ds-cream/40 p-3"
                >
                  <h3 className="text-[11px] font-semibold uppercase tracking-wide text-ds-muted">
                    {stage}
                  </h3>
                  {[1, 2, 3].map((card) => (
                    <div key={card} className="rounded-lg border border-ds-border bg-white p-2.5 shadow-sm">
                      <p className="text-sm font-semibold text-ds-ink">Job {i + 1}.{card}</p>
                      <p className="mt-1 text-xs text-ds-muted">Cliente exemplo · Foto</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="h-32" aria-hidden />
      </div>
    </AppShell>
  );
}
