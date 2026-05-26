"use client";

import { Check, ChevronRight, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { markTourCompleted } from "@/lib/onboarding/tour-actions";
import { cn } from "@/lib/utils";

const DISMISS_KEY = "donyapp_activation_checklist_dismissed";

type Step = {
  id: string;
  label: string;
  hint?: string;
  done: boolean;
  href: string;
};

/** Conta provisionada com um único tipo «Geral» — pedimos que ajustem em Kanban antes de seguir. */
function jobTypesLookConfigured(workTypes: { name: string }[]): boolean {
  if (workTypes.length === 0) return false;
  if (workTypes.length > 1) return true;
  return workTypes[0].name.trim().toLowerCase() !== "geral";
}

export function ActivationChecklist({
  workTypes,
  contactsCount,
  jobsCount,
  agendaConnected,
  tourCompleted,
}: {
  workTypes: { name: string }[];
  contactsCount: number;
  jobsCount: number;
  agendaConnected: boolean;
  tourCompleted: boolean;
}) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      setDismissed(window.localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  const jobTypesConfigured = useMemo(() => jobTypesLookConfigured(workTypes), [workTypes]);

  const steps: Step[] = useMemo(
    () => [
      {
        id: "work_types",
        label: "Configurar tipos de job",
        hint: !jobTypesConfigured
          ? "Em Configurações → Kanban: renomeie «Geral» ou crie os tipos que o estúdio usa de verdade."
          : undefined,
        done: jobTypesConfigured,
        href: "/settings/kanban",
      },
      {
        id: "contact",
        label: "Cadastrar um ou mais contatos",
        hint:
          contactsCount < 1
            ? "Vários de uma vez: Configurações → Importar aceita planilha .csv."
            : undefined,
        done: contactsCount >= 1,
        href: "/contacts",
      },
      {
        id: "job",
        label: "Cadastrar um job",
        done: jobsCount >= 1,
        href: "/dashboard#btn-novo-job",
      },
      {
        id: "agenda",
        label: "Conectar a agenda Google (opcional)",
        done: agendaConnected,
        href: "/settings/agenda",
      },
    ],
    [contactsCount, jobsCount, jobTypesConfigured, agendaConnected],
  );

  const doneCount = steps.filter((s) => s.done).length;
  const allDone = doneCount === steps.length;

  useEffect(() => {
    if (!allDone || tourCompleted) return;
    void (async () => {
      const res = await markTourCompleted();
      if (res.ok) router.refresh();
    })();
  }, [allDone, tourCompleted, router]);

  const dismiss = useCallback(() => {
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  }, []);

  if (dismissed || allDone) return null;

  return (
    <section
      className="rounded-ds-card border border-ds-border bg-gradient-to-br from-ds-surface to-ds-cream/40 p-4 shadow-ds-sm sm:p-5"
      aria-labelledby="activation-checklist-heading"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="activation-checklist-heading" className="text-sm font-semibold text-ds-ink">
            Primeiros passos
          </h2>
          <p className="mt-1 text-xs text-ds-muted">
            {doneCount}/{steps.length} concluídos. Ordem sugerida: tipos de job → contatos → job → agenda.
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-ds-lg p-1.5 text-ds-muted transition-colors duration-ds-fast hover:bg-ds-cream hover:text-ds-ink"
          aria-label="Ocultar checklist"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ds-hairline">
        <div
          className="h-full rounded-full bg-ds-accent transition-[width] duration-ds-modal"
          style={{ inlineSize: `${(doneCount / steps.length) * 100}%` }}
        />
      </div>

      <ol className="mt-4 space-y-2">
        {steps.map((step) => (
          <li key={step.id}>
            <Link
              href={step.href}
              className={cn(
                "flex items-center gap-3 rounded-ds-lg border px-3 py-2.5 text-sm transition-colors duration-ds-fast",
                step.done
                  ? "border-ds-success/25 bg-ds-success-soft/50 text-ds-ink"
                  : "border-ds-border bg-ds-surface text-ds-ink hover:border-ds-accent/30 hover:bg-ds-cream/60",
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
                  step.done
                    ? "border-ds-success/35 bg-ds-success-soft text-ds-success"
                    : "border-ds-border bg-ds-surface text-ds-muted",
                )}
                aria-hidden
              >
                {step.done ? <Check className="h-4 w-4" strokeWidth={2.5} /> : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className={cn("block font-medium", step.done && "line-through opacity-80")}>
                  {step.label}
                </span>
                {step.hint ? (
                  <span className="mt-1 block text-xs font-normal leading-snug text-ds-muted">
                    {step.hint}
                  </span>
                ) : null}
              </span>
              {!step.done ? (
                <ChevronRight className="h-4 w-4 shrink-0 text-ds-muted-2" aria-hidden />
              ) : null}
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
