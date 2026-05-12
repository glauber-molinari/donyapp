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
      className="rounded-ds-xl border border-app-border bg-gradient-to-br from-app-sidebar to-ds-cream/40 p-4 shadow-sm sm:p-5"
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
          className="shrink-0 rounded-ds-xl p-1.5 text-ds-subtle transition hover:bg-white/60 hover:text-ds-ink"
          aria-label="Ocultar checklist"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-app-border">
        <div
          className="h-full rounded-full bg-app-primary transition-[width] duration-300"
          style={{ inlineSize: `${(doneCount / steps.length) * 100}%` }}
        />
      </div>

      <ol className="mt-4 space-y-2">
        {steps.map((step) => (
          <li key={step.id}>
            <Link
              href={step.href}
              className={cn(
                "flex items-center gap-3 rounded-ds-xl border px-3 py-2.5 text-sm transition",
                step.done
                  ? "border-emerald-200/80 bg-emerald-50/50 text-emerald-900"
                  : "border-app-border bg-app-sidebar/80 text-ds-ink hover:border-app-primary/30 hover:bg-white/70",
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
                  step.done
                    ? "border-emerald-300 bg-emerald-100 text-emerald-800"
                    : "border-app-border bg-white text-ds-subtle",
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
                <ChevronRight className="h-4 w-4 shrink-0 text-ds-subtle" aria-hidden />
              ) : null}
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
