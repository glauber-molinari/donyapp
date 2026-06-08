"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { toggleAlbumBoard } from "./kanban-actions";
import { SettingsKanbanSection } from "./settings-kanban-section";
import { SettingsManualAssigneesSection } from "./settings-manual-assignees-section";
import { SettingsWorkTypesSection } from "./settings-work-types-section";
import { canCreateAlbum } from "@/lib/plan-limits";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type { BoardType, Database } from "@/types/database";

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
  albumBoardEnabled,
}: {
  stages: Stage[];
  workTypes: WorkType[];
  plan: Plan;
  isAdmin: boolean;
  manualAssignees: ManualAssignee[];
  accountUserCount: number;
  albumBoardEnabled: boolean;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<KanbanSettingsTab>("stages");
  const [albumToggleBusy, setAlbumToggleBusy] = useState(false);
  const proAlbum = canCreateAlbum(plan);

  const edicaoStages = useMemo(
    () => stages.filter((s) => (s.board_type as BoardType) !== "album"),
    [stages]
  );
  const albumStages = useMemo(
    () => stages.filter((s) => (s.board_type as BoardType) === "album"),
    [stages]
  );

  async function handleAlbumToggle(next: boolean) {
    setAlbumToggleBusy(true);
    try {
      const res = await toggleAlbumBoard(next);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(
        next ? "Quadro de Álbuns ativado." : "Quadro de Álbuns desativado."
      );
      router.refresh();
    } finally {
      setAlbumToggleBusy(false);
    }
  }

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
        className={tab === "stages" ? "flex flex-col gap-8" : "hidden"}
      >
        <SettingsKanbanSection
          stages={edicaoStages}
          plan={plan}
          isAdmin={isAdmin}
          boardType="edicao"
        />

        <div className="h-px w-full bg-ds-border/60" aria-hidden />

        <section
          className="flex flex-col gap-4"
          aria-labelledby="settings-album-board-toggle"
        >
          <div className="flex flex-col gap-3 rounded-ds-lg border border-ds-border bg-ds-cream/30 p-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              <h3
                id="settings-album-board-toggle"
                className="text-sm font-semibold text-ds-ink"
              >
                Quadro de Álbuns
                {!proAlbum ? (
                  <span className="ml-2 rounded-md bg-ds-ink/10 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-ds-muted">
                    Pro
                  </span>
                ) : null}
              </h3>
              <p className="mt-1 text-xs text-ds-muted">
                Adiciona um quadro separado pra acompanhar a produção física do
                álbum.
              </p>
            </div>
            <label
              className={cn(
                "inline-flex shrink-0 cursor-pointer items-center gap-2 text-xs font-medium",
                (!isAdmin || !proAlbum || albumToggleBusy) &&
                  "cursor-not-allowed opacity-60"
              )}
            >
              <span className="text-ds-muted">
                {albumBoardEnabled ? "Ativado" : "Desativado"}
              </span>
              <span
                role="switch"
                aria-checked={albumBoardEnabled}
                tabIndex={isAdmin && proAlbum && !albumToggleBusy ? 0 : -1}
                onClick={() => {
                  if (!isAdmin || !proAlbum || albumToggleBusy) return;
                  void handleAlbumToggle(!albumBoardEnabled);
                }}
                onKeyDown={(e) => {
                  if (!isAdmin || !proAlbum || albumToggleBusy) return;
                  if (e.key === " " || e.key === "Enter") {
                    e.preventDefault();
                    void handleAlbumToggle(!albumBoardEnabled);
                  }
                }}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                  albumBoardEnabled ? "bg-ds-accent" : "bg-ds-border"
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "inline-block h-5 w-5 rounded-full bg-white shadow transition-transform",
                    albumBoardEnabled ? "translate-x-5" : "translate-x-0.5"
                  )}
                />
              </span>
            </label>
          </div>

          {albumBoardEnabled ? (
            <SettingsKanbanSection
              stages={albumStages}
              plan={plan}
              isAdmin={isAdmin}
              boardType="album"
            />
          ) : null}
        </section>
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
