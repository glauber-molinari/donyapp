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
          <span className="ml-1 rounded-md bg-ds-ink/10 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-ds-muted">
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
        className="flex flex-wrap gap-1 border-b border-ds-border pb-px"
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
              "-mb-px border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
              tab === t.id
                ? "border-ds-accent text-ds-ink"
                : "border-transparent text-ds-muted hover:text-ds-ink"
            )}
          >
            {t.label}
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
          <div className="rounded-ds-xl border border-amber-100 bg-amber-50/90 px-4 py-4 text-sm text-amber-950">
            <p className="font-medium text-amber-950">Disponível no plano Pro</p>
            <p className="mt-2 text-amber-900/95">
              Cadastre responsáveis por nome, e-mail e foto quando você é o único usuário da conta —
              útil para equipes externas sem convite no app.
            </p>
            <p className="mt-3">
              <Link
                href="/settings/plan"
                className="font-medium text-ds-accent underline underline-offset-2"
              >
                Ver planos e fazer upgrade
              </Link>
            </p>
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
