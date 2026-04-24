"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";

import { SettingsKanbanSection } from "./settings-kanban-section";
import { SettingsManualAssigneesSection } from "./settings-manual-assignees-section";
import { SettingsWorkTypesSection } from "./settings-work-types-section";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database";

type Stage = Database["public"]["Tables"]["kanban_stages"]["Row"];
type WorkType = Database["public"]["Tables"]["job_work_types"]["Row"];
type ManualAssignee = Database["public"]["Tables"]["manual_job_assignees"]["Row"];
type Plan = Database["public"]["Tables"]["subscriptions"]["Row"]["plan"];

type KanbanSettingsTab = "stages" | "workTypes" | "assignees";

export function SettingsKanbanTabs({
  stages,
  workTypes,
  plan,
  isAdmin,
  manualAssignees,
  accountUserCount,
}: {
  stages: Stage[];
  workTypes: WorkType[];
  plan: Plan;
  isAdmin: boolean;
  manualAssignees: ManualAssignee[];
  accountUserCount: number;
}) {
  const [tab, setTab] = useState<KanbanSettingsTab>("stages");

  const tabs: { id: KanbanSettingsTab; label: string; suffix?: ReactNode }[] = [
    { id: "stages", label: "Etapas" },
    { id: "workTypes", label: "Tipos de trabalho" },
    {
      id: "assignees",
      label: "Responsáveis",
      suffix:
        plan === "pro" ? undefined : (
          <span className="rounded-md bg-ds-ink/10 px-1 py-px text-[9px] font-semibold uppercase tracking-wide text-ds-muted max-md:mt-0.5 md:ml-1 md:px-1.5 md:text-[10px]">
            Pro
          </span>
        ),
    },
  ];

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div
        role="tablist"
        aria-label="Seções do Kanban"
        className="grid w-full grid-cols-3 gap-0 border-b border-ds-border pb-px md:flex md:flex-wrap md:gap-1"
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            id={`kanban-tab-${t.id}`}
            aria-controls={`kanban-panel-${t.id}`}
            onClick={() => setTab(t.id)}
            className={cn(
              "-mb-px flex min-h-[2.85rem] flex-col items-center justify-center gap-0.5 border-b-2 px-1 py-1.5 text-center text-[11px] font-medium leading-tight transition-colors md:min-h-0 md:flex-row md:px-3 md:py-2.5 md:text-left md:text-sm",
              tab === t.id
                ? "border-ds-accent text-ds-ink"
                : "border-transparent text-ds-muted hover:text-ds-ink"
            )}
          >
            <span className="max-md:max-w-full max-md:text-balance">{t.label}</span>
            {t.suffix}
          </button>
        ))}
      </div>

      <div
        id="kanban-panel-stages"
        role="tabpanel"
        aria-labelledby="kanban-tab-stages"
        hidden={tab !== "stages"}
        className={tab === "stages" ? "flex flex-col gap-4" : "hidden"}
      >
        <SettingsKanbanSection stages={stages} plan={plan} isAdmin={isAdmin} />
      </div>

      <div
        id="kanban-panel-workTypes"
        role="tabpanel"
        aria-labelledby="kanban-tab-workTypes"
        hidden={tab !== "workTypes"}
        className={tab === "workTypes" ? "flex flex-col gap-4" : "hidden"}
      >
        <SettingsWorkTypesSection workTypes={workTypes} isAdmin={isAdmin} />
      </div>

      <div
        id="kanban-panel-assignees"
        role="tabpanel"
        aria-labelledby="kanban-tab-assignees"
        hidden={tab !== "assignees"}
        className={tab === "assignees" ? "flex flex-col gap-4" : "hidden"}
      >
        {plan !== "pro" ? (
          <div className="relative overflow-hidden rounded-lg border-2 border-ds-accent bg-gradient-to-br from-orange-50 to-orange-100/50 p-6">
            <div className="mb-3 flex items-center gap-2">
              <span className="rounded-full bg-ds-accent px-3 py-1.5 text-xs font-bold text-white">
                EXCLUSIVO PRO
              </span>
            </div>
            <h3 className="mb-2 text-lg font-bold text-orange-900">Responsáveis Manuais</h3>
            <p className="mb-4 text-sm text-orange-800">
              Cadastre editores externos por nome, e-mail e foto. Ideal quando você trabalha com freelancers ou equipes externas que não precisam acessar o Donyapp.
            </p>
            <div className="mb-4 rounded-lg bg-white/60 p-3">
              <p className="text-xs font-medium text-orange-900">✨ Funcionalidades:</p>
              <ul className="mt-2 space-y-1 text-xs text-orange-800">
                <li>• Cadastro ilimitado de responsáveis</li>
                <li>• Nome, e-mail e foto personalizados</li>
                <li>• Atribuição direta nos jobs do quadro</li>
                <li>• Gestão completa sem convites de acesso</li>
              </ul>
            </div>
            <a
              href="/settings/plan"
              className="inline-flex items-center gap-1 text-sm font-semibold text-ds-accent hover:underline"
            >
              Fazer upgrade para PRO
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        ) : (
          <SettingsManualAssigneesSection
            assignees={manualAssignees}
            isAdmin={isAdmin}
            accountUserCount={accountUserCount}
          />
        )}
      </div>
    </div>
  );
}
